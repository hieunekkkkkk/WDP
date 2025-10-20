const AiBotService = require('../services/aibot.service');


class AiBotController {
    async createBot(req, res) {
        try {
            const bot = await AiBotService.createBot(req.body);
            res.status(201).json(bot);
        } catch (err) {
            console.error('Error creating bot:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllBotsWithKnowledge(req, res) {
        try {
            const bots = await AiBotService.getAllBotsWithKnowledge();
            res.status(200).json(bots);
        } catch (err) {
            console.error('Error fetching bots with knowledge:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getBotsByOwner(req, res) {
        try {
            const { ownerId } = req.params;
            const bots = await AiBotService.getBotsByOwner(ownerId);
            res.status(200).json(bots);
        } catch (err) {
            console.error('Error fetching bots:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getBotById(req, res) {
        try {
            const { id } = req.params;
            const bot = await AiBotService.getBotById(id);
            if (!bot) return res.status(404).json({ error: 'Bot not found' });
            res.status(200).json(bot);
        } catch (err) {
            console.error('Error fetching bot:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateBot(req, res) {
        try {
            const { id } = req.params;
            const updatedBot = await AiBotService.updateBot(id, req.body);
            if (!updatedBot) return res.status(404).json({ error: 'Bot not found' });
            res.status(200).json(updatedBot);
        } catch (err) {
            console.error('Error updating bot:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteBot(req, res) {
        try {
            const { id } = req.params;
            const deletedBot = await AiBotService.deleteBot(id);
            if (!deletedBot) return res.status(404).json({ error: 'Bot not found' });
            res.status(200).json({ message: 'Bot deleted successfully' });
        } catch (err) {
            console.error('Error deleting bot:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async testHandleMessage(req, res) {
        try {
            const { botId } = req.params;
            const { message } = req.params;
            if (!message) return res.status(400).json({ error: 'Message is required' });
            const response = await AiBotService.testHandleMessage(botId, message);
            res.status(200).json({ response });
        } catch (err) {
            console.error('Error testing bot message handling:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new AiBotController();
