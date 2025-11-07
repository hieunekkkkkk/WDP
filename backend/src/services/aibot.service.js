require('dotenv').config();
const AiBot = require('../entity/module/aibot.model');
const BotKnowledgeService = require('./botknowledge.service');
const { QdrantClient } = require('@qdrant/js-client-rest');
const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { QdrantVectorStore } = require('@langchain/qdrant');
const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const mongoose = require('mongoose');

class AiBotService {
    constructor() {
        // Initialize Qdrant client
        this.qdrantClient = new QdrantClient({
            url: process.env.QDRANT_URL || 'http://localhost:6333',
        });

        // Initialize Gemini embeddings
        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: 'gemini-embedding-001',
        });

        // Initialize Gemini chat model
        this.chatModel = new ChatGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            temperature: 0.7,
            maxOutputTokens: 2048,
        });

        // Text splitter for chunking documents
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
    }

    // Get collection name for a specific bot
    _getCollectionName(botId) {
        return `bot_${botId}_knowledge`;
    }

    // Tạo mới bot
    async createBot(data) {
        const bot = new AiBot(data);
        const savedBot = await bot.save();

        // Create Qdrant collection for this bot
        await this._createQdrantCollection(savedBot._id.toString());

        return savedBot;
    }

    // Create Qdrant collection for bot knowledge
    async _createQdrantCollection(botId) {
        const collectionName = this._getCollectionName(botId);

        try {
            // Check if collection exists
            const collections = await this.qdrantClient.getCollections();
            const exists = collections.collections.some(c => c.name === collectionName);

            if (!exists) {
                await this.qdrantClient.createCollection(collectionName, {
                    vectors: {
                        size: 768, // Gemini embedding-001 dimension
                        distance: 'Cosine',
                    },
                });
                console.log(`Created Qdrant collection: ${collectionName}`);
            }
        } catch (error) {
            console.error('Error creating Qdrant collection:', error);
            throw error;
        }
    }

    // Lấy tất cả bot theo owner
    async getBotsByOwner(ownerId) {
        const bot = await AiBot.findOne({ owner_id: ownerId });
        if (!bot) return null;

        const botId = new mongoose.Types.ObjectId(bot._id);
        return await this.getBotById(botId);
    }

    async getAllBotsWithKnowledge() {
        const bots = await AiBot.find();
        const botsWithKnowledge = [];
        for (const bot of bots) {
            const knowledge = await BotKnowledgeService.getKnowledgeByBotId(bot._id);
            botsWithKnowledge.push({
                id: bot._id,
                name: bot.name,
                description: bot.description,
                status: bot.status,
                ownerId: bot.owner_id,
                knowledge: knowledge.map(k => ({
                    title: k.title,
                    content: k.content,
                    tags: k.tags,
                }))
            });
        }
        return botsWithKnowledge;
    }

    // Lấy chi tiết bot
    async getBotById(id) {
        const bot = await AiBot.findById(id);
        const knowledge = await BotKnowledgeService.getKnowledgeByBotId(id);

        return {
            id: bot._id,
            name: bot.name,
            description: bot.description,
            status: bot.status,
            ownerId: bot.owner_id,
            knowledge: knowledge.map(k => ({
                title: k.title,
                content: k.content,
                tags: k.tags,
            }))
        };
    }

    // Cập nhật bot
    async updateBot(id, updateData) {
        return await AiBot.findByIdAndUpdate(id, updateData, { new: true });
    }

    // Xóa bot
    async deleteBot(id) {
        const collectionName = this._getCollectionName(id);

        try {
            // Delete Qdrant collection
            await this.qdrantClient.deleteCollection(collectionName);
        } catch (error) {
            console.error('Error deleting Qdrant collection:', error);
        }

        return await AiBot.findByIdAndDelete(id);
    }

    // Index bot knowledge into Qdrant vector store
    async indexBotKnowledge(botId) {
        try {
            const knowledge = await BotKnowledgeService.getKnowledgeByBotId(botId);

            if (knowledge.length === 0) {
                console.log('No knowledge to index for bot:', botId);
                return;
            }

            // Prepare documents from knowledge base
            const documents = [];
            for (const item of knowledge) {
                const doc = new Document({
                    pageContent: item.content,
                    metadata: {
                        title: item.title,
                        tags: item.tags,
                        knowledgeId: item._id.toString(),
                        botId: botId,
                    },
                });
                documents.push(doc);
            }

            // Split documents into chunks
            const splitDocs = await this.textSplitter.splitDocuments(documents);

            // Create vector store and add documents
            const collectionName = this._getCollectionName(botId);

            await QdrantVectorStore.fromDocuments(
                splitDocs,
                this.embeddings,
                {
                    client: this.qdrantClient,
                    collectionName: collectionName,
                }
            );

            console.log(`Indexed ${splitDocs.length} document chunks for bot ${botId}`);
            return { indexed: splitDocs.length };
        } catch (error) {
            console.error('Error indexing bot knowledge:', error);
            throw error;
        }
    }

    async testHandleMessage(botId, message) {
        try {
            const bot = await AiBot.findById(botId);
            if (!bot) {
                throw new Error('Bot not found');
            }

            const collectionName = this._getCollectionName(botId);

            // Initialize vector store
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                this.embeddings,
                {
                    client: this.qdrantClient,
                    collectionName: collectionName,
                }
            );

            // Retrieve relevant documents
            const retriever = vectorStore.asRetriever({
                k: 4, // Number of relevant documents to retrieve
            });

            const relevantDocs = await retriever.getRelevantDocuments(message);

            // Format context from retrieved documents
            const context = relevantDocs
                .map((doc, i) => `[${i + 1}] ${doc.pageContent}`)
                .join('\n\n');

            // Format conversation history
            const historyText = conversationHistory
                .slice(-5) // Keep last 5 messages for context
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n');

            // Create RAG prompt template
            const promptTemplate = PromptTemplate.fromTemplate(`
You are {botName}, an AI assistant. {botDescription}

Use the following context from the knowledge base to answer the user's question. 
If the answer is not in the context, use your general knowledge but mention that the information is not from the knowledge base.

Context from Knowledge Base:
{context}

Previous Conversation:
{history}

Current Question: {question}

Please provide a helpful, accurate, and friendly response:
`);

            // Create RAG chain
            const ragChain = RunnableSequence.from([
                promptTemplate,
                this.chatModel,
                new StringOutputParser(),
            ]);

            // Generate response
            const response = await ragChain.invoke({
                botName: bot.name,
                botDescription: bot.description || 'a helpful assistant',
                context: context || 'No specific context available.',
                history: historyText || 'No previous conversation.',
                question: message,
            });

            return {
                response: response,
                relevantDocs: relevantDocs.map(doc => ({
                    content: doc.pageContent.substring(0, 200) + '...',
                    metadata: doc.metadata,
                })),
            };
        } catch (error) {
            console.error('Error handling message:', error);

            // Fallback to basic response if RAG fails
            try {
                const bot = await AiBot.findById(botId);
                const basicPrompt = `You are ${bot.name}. ${bot.description || ''}\n\nUser: ${message}\n\nAssistant:`;
                const response = await this.chatModel.invoke(basicPrompt);

                return {
                    response: response.content,
                    relevantDocs: [],
                    warning: 'Responded without knowledge base context due to error',
                };
            } catch (fallbackError) {
                throw new Error('Failed to generate response: ' + fallbackError.message);
            }
        }
    }

    // Handle chatbot message with RAG
    async handleMessage(botId, message, conversationHistory = []) {
    }

    // Search in bot's knowledge base
    async searchKnowledge(botId, query, limit = 5) {
        try {
            const collectionName = this._getCollectionName(botId);

            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                this.embeddings,
                {
                    client: this.qdrantClient,
                    collectionName: collectionName,
                }
            );

            const results = await vectorStore.similaritySearch(query, limit);

            return results.map(doc => ({
                content: doc.pageContent,
                metadata: doc.metadata,
            }));
        } catch (error) {
            console.error('Error searching knowledge:', error);
            throw error;
        }
    }

    // Re-index specific knowledge item
    async reindexKnowledge(botId, knowledgeId) {
        try {
            // This is a simplified version - in production you might want to update specific vectors
            // For now, we'll re-index all knowledge
            await this.indexBotKnowledge(botId);
            return { success: true, message: 'Knowledge re-indexed successfully' };
        } catch (error) {
            console.error('Error re-indexing knowledge:', error);
            throw error;
        }
    }

    // Get collection stats
    async getCollectionStats(botId) {
        try {
            const collectionName = this._getCollectionName(botId);
            const info = await this.qdrantClient.getCollection(collectionName);

            return {
                vectorsCount: info.vectors_count || 0,
                pointsCount: info.points_count || 0,
                status: info.status,
            };
        } catch (error) {
            console.error('Error getting collection stats:', error);
            return {
                vectorsCount: 0,
                pointsCount: 0,
                status: 'not_found',
            };
        }
    }
}

module.exports = new AiBotService();
