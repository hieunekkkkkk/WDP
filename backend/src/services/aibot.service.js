require('dotenv').config();
const AiBot = require('../entity/module/aibot.model');
const BotKnowledgeService = require('./botknowledge.service');
const qdrantClientSingleton = require('../utils/qdrantClient');
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
            timeout: 30000, // 30s timeout
        });

        // Dùng shared Qdrant client (không check availability ở đây nữa)
        this.qdrantClient = qdrantClientSingleton.getClient();

        // 🔥 Cache knowledge context cho mỗi bot
        this.knowledgeCache = new Map();

        // 🔥 Cache TTL: 30 phút
        this.CACHE_TTL = 30 * 60 * 1000;

        // 🧹 Cleanup cache mỗi 10 phút
        setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
    }

    /**
     * 🔥 Get cached knowledge hoặc fetch mới
     */
    async getKnowledgeContext(botId, bot) {
        const cacheKey = botId.toString();
        const cached = this.knowledgeCache.get(cacheKey);

        // ✅ Cache hit và chưa expire
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            console.log(`📦 Using cached knowledge for bot ${cacheKey}`);
            return cached.context;
        }

        // ❌ Cache miss hoặc expired → Build context mới
        console.log(`🔄 Building knowledge context for bot ${cacheKey}`);
        const context = bot.knowledge.map((k, i) =>
            `[${i + 1}] ${k.title}: ${k.content}`
        ).join('\n\n');

        // 💾 Cache context
        this.knowledgeCache.set(cacheKey, {
            context,
            timestamp: Date.now()
        });

        return context;
    }

    /**
     * 🧹 Cleanup expired cache
     */
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.knowledgeCache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.knowledgeCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired knowledge cache entries`);
        }
    }

    /**
     * 🔄 Invalidate cache khi knowledge thay đổi
     */
    invalidateCache(botId) {
        const cacheKey = botId.toString();
        this.knowledgeCache.delete(cacheKey);
        console.log(`🗑️ Invalidated cache for bot ${cacheKey}`);
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

        // 🔥 Lấy cached knowledge context
        const allKnowledgeContext = await this.getKnowledgeContext(botId, bot);

        if (!allKnowledgeContext || allKnowledgeContext.trim() === '') {
            console.error('❌ No knowledge available for bot:', botId);
            return {
                response: 'Xin lỗi, bot chưa được cấu hình kiến thức. Vui lòng liên hệ doanh nghiệp.',
                relevantDocs: []
            };
        }

        // Lấy kiến thức liên quan từ Qdrant (nếu có)
        let relevantDocs = [];
        let context = allKnowledgeContext; // Default: dùng all knowledge

        // Check Qdrant availability
        const isQdrantReady = await qdrantClientSingleton.checkAvailability();

        if (isQdrantReady) {
            try {
                console.log('🔍 Searching knowledge via Qdrant...');
                relevantDocs = await BotKnowledgeService.searchKnowledge(botId, message, 4);

                if (relevantDocs && relevantDocs.length > 0) {
                    // ✅ Tìm thấy relevant docs → Dùng chúng thay vì all knowledge
                    context = relevantDocs.map((d, i) => `[${i + 1}] ${d.content}`).join('\n\n');
                    console.log(`✅ Found ${relevantDocs.length} relevant docs from Qdrant`);
                } else {
                    // ⚠️ Không tìm thấy → Giữ nguyên all knowledge
                    console.warn('⚠️ No relevant docs found, using all knowledge');
                }
            } catch (err) {
                console.warn('⚠️ Qdrant search failed, using all knowledge:', err.message);
                // ❌ Qdrant error → Giữ nguyên all knowledge
            }
        } else {
            console.log('📝 Qdrant not available, using all knowledge');
        }

        console.log(`📚 Using context with ${context.split('\n\n').length} knowledge items`);

        // Load lịch sử hội thoại từ Redis
        let historyText = '';
        if (conversationId) {
            try {
                const msgs = await RedisClient.lrange(`chat:${conversationId}:messages`, 0, -1);
                historyText = (msgs || [])
                    .slice(-5)
                    .map(m => `${m.role || 'user'}: ${m.content || m.message || ''}`)
                    .join('\n');
            } catch (err) {
                console.warn('⚠️ Failed to load chat history:', err.message);
            }
        }

        const prompt = PromptTemplate.fromTemplate(`
You are {botName}, an AI assistant. {botDescription}

Context from knowledge base:
{context}

Previous messages:
{history}

User: {question}
Answer helpfully and naturally in Vietnamese. If the question is not related to your knowledge, respond politely that you can only help with topics related to your business.
`);

        const ragChain = RunnableSequence.from([
            prompt,
            this.chatModel,
            new StringOutputParser(),
        ]);

        try {
            // 🔥 Gọi Gemini với timeout protection
            const response = await Promise.race([
                ragChain.invoke({
                    botName: bot.name,
                    botDescription: bot.description || '',
                    context: context,
                    history: historyText || 'No previous conversation.',
                    question: message,
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Gemini timeout')), 25000)
                )
            ]);

            return {
                response,
                relevantDocs,
            };
        } catch (err) {
            console.error('❌ Gemini API error:', err.message);

            // 🔥 Fallback response khi Gemini fail
            const fallbackResponse = this.generateFallbackResponse(message, bot);

            return {
                response: fallbackResponse,
                relevantDocs,
                error: 'Used fallback due to API error'
            };
        }
    }

    /**
     * 🔥 Generate fallback response khi Gemini timeout
     */
    generateFallbackResponse(message, bot) {
        const lowerMessage = message.toLowerCase().trim();

        // Simple pattern matching
        if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return `Xin chào! Tôi là ${bot.name}. ${bot.description || 'Tôi có thể giúp gì cho bạn?'}`;
        }

        if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
            return `Để biết thông tin về giá cả, bạn có thể xem menu của chúng tôi hoặc liên hệ trực tiếp. Tôi đang gặp chút vấn đề kỹ thuật, xin lỗi vì sự bất tiện này.`;
        }

        if (lowerMessage.includes('địa chỉ') || lowerMessage.includes('ở đâu')) {
            return `Để biết địa chỉ cụ thể, vui lòng xem thông tin trên trang doanh nghiệp. Tôi đang gặp chút vấn đề kỹ thuật, xin lỗi vì sự bất tiện này.`;
        }

        if (lowerMessage.includes('giờ mở cửa') || lowerMessage.includes('mở cửa')) {
            return `Để biết giờ mở cửa, vui lòng xem thông tin trên trang doanh nghiệp. Tôi đang gặp chút vấn đề kỹ thuật, xin lỗi vì sự bất tiện này.`;
        }

        // Default fallback
        return `Xin lỗi, hệ thống đang gặp chút vấn đề kỹ thuật. Vui lòng thử lại sau hoặc liên hệ trực tiếp với doanh nghiệp. Cảm ơn bạn đã thông cảm!`;
    }
}



module.exports = new AiBotService();
