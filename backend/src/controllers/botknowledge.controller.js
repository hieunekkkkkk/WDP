const KnowledgeService = require('../services/botknowledge.service');

class BotKnowledgeController {
    // POST /botknowledge
    async createKnowledge(req, res) {
        try {
            const aibot_id = req.params.aibot_id;
            const knowledge = await KnowledgeService.createKnowledge(aibot_id, req.body);
            res.status(201).json(knowledge);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // GET /botknowledge
    async getKnowledges(req, res) {
        try {
            const knowledges = await KnowledgeService.getKnowledges();
            res.status(200).json(knowledges);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // PUT /botknowledge/:id
    async updateKnowledge(req, res) {
        try {
            const knowledge = await KnowledgeService.updateKnowledge(req.params.id, req.body);
            res.status(200).json(knowledge);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // DELETE /botknowledge/:id
    async deleteKnowledge(req, res) {
        try {
            await KnowledgeService.deleteKnowledge(req.params.id);
            res.status(200).json({ message: 'Knowledge deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new BotKnowledgeController();