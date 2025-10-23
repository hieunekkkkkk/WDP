const AiBot = require('../entity/module/aibot.model');
const BotKnowledgeService = require('./botknowledge.service');

class AiBotService {
    // Tạo mới bot
    async createBot(data) {
        const bot = new AiBot(data);
        return await bot.save();
    }

    // Lấy tất cả bot theo owner
    async getBotsByOwner(ownerId) {
        return await AiBot.find({ owner_id: ownerId });
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

    async testHandleMessage(botId, message) {
        const bot = await AiBot.findById(botId);
        if (!bot) throw new Error('Bot not found');
        return await this.handleMessage(bot, message);
    }



    async handleMessage(bot, message) {
        // Giả sử bot có một phương thức để xử lý tin nhắn
        // Thực tế có thể tích hợp với OpenAI hoặc các dịch vụ AI khác
        // Ở đây chỉ là ví dụ đơn giản trả về tin nhắn đã nhận
        return `Bot (${bot.name}) received: ${message}`;
    }
}

module.exports = new AiBotService();
