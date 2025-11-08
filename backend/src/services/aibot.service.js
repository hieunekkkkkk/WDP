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
const RedisClient = require('../utils/redis');

class AiBotService {
    constructor() {
        this.chatModel = new ChatGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            temperature: 0.7,
            maxOutputTokens: 2048,
        });
    }


    // Tạo mới bot
    async createBot(data) {
        const bot = new AiBot(data);
        return await bot.save();
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
        return await AiBot.findByIdAndDelete(id);
    }

    async handleMessage(botId, message, conversationId = null) {
        const bot = await this.getBotById(botId);
        if (!bot) throw new Error('Bot not found');

        // Lấy kiến thức liên quan
        const relevantDocs = await BotKnowledgeService.searchKnowledge(botId, message, 4);
        const context = relevantDocs.map((d, i) => `[${i + 1}] ${d.content}`).join('\n\n');

        // Load lịch sử hội thoại từ Redis
        let historyText = '';
        if (conversationId) {
            const msgs = await RedisClient.lrange(`chat:${conversationId}:messages`, 0, -1);
            historyText = (msgs || [])
                .slice(-5)
                .map(m => `${m.role || 'user'}: ${m.content || m.message || ''}`)
                .join('\n');
        }

        const prompt = PromptTemplate.fromTemplate(`
You are {botName}, an AI assistant. {botDescription}

Context from knowledge base:
{context}

Previous messages:
{history}

User: {question}
Answer helpfully and naturally:
`);

        const ragChain = RunnableSequence.from([
            prompt,
            this.chatModel,
            new StringOutputParser(),
        ]);

        const response = await ragChain.invoke({
            botName: bot.name,
            botDescription: bot.description || '',
            context: context || 'No specific context available.',
            history: historyText || 'No previous conversation.',
            question: message,
        });

        return {
            response,
            relevantDocs,
        };
    }
}

   

module.exports = new AiBotService();
