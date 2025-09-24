const botKnowledgeModel = require('../entity/module/botknowledge.model');


class BotKnowledgeService {
    // Tạo mới kiến thức
    async createKnowledge(data) {
        try {
            const knowledge = new botKnowledgeModel({
                title: data.title,
                content: data.content,
                tags: data.tags,
            });
            await knowledge.save();
            return knowledge;
        } catch (error) {
            throw error;
        }
    }
    // Lấy danh sách kiến thức
    async getKnowledges() {
        try {
            return await botKnowledgeModel.find().sort({ created_at: -1 });
        } catch (error) {
            throw error;
        }
    }
    // Cập nhật kiến thức
    async updateKnowledge(id, data) {
        try {
            return await botKnowledgeModel.findByIdAndUpdate(id, {
                title: data.title,
                content: data.content,
                tags: data.tags,
            });
        } catch (error) {
            throw error;
        }
    }
    // Xoá kiến thức
    async deleteKnowledge(id) {
        try {
            return await botKnowledgeModel.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new BotKnowledgeService();
