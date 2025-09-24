const AiBot = require('../entity/module/aibot.model');

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

    // Lấy chi tiết bot
    async getBotById(id) {
        return await AiBot.findById(id);
    }

    // Cập nhật bot
    async updateBot(id, updateData) {
        return await AiBot.findByIdAndUpdate(id, updateData, { new: true });
    }

    // Xóa bot
    async deleteBot(id) {
        return await AiBot.findByIdAndDelete(id);
    }

    async handleMessage(bot, message) {
        // Giả sử bot có một phương thức để xử lý tin nhắn
        // Thực tế có thể tích hợp với OpenAI hoặc các dịch vụ AI khác
        // Ở đây chỉ là ví dụ đơn giản trả về tin nhắn đã nhận
        return `Bot (${bot.name}) received: ${message}`;
    }
}

module.exports = new AiBotService();
