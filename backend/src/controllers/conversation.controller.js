const conversationService = require('../services/conversation.service');
const chatGateway = require('../gateway/chatGateway');

class ConversationController {
    async checkConversation(req, res) {
        try {
            const { sender_id, receiver_id } = req.body;

            if (!sender_id || !receiver_id) {
                return res.status(400).json({ error: 'sender_id và receiver_id là bắt buộc' });
            }

            const result = await conversationService.checkOrCreateConversation(sender_id, receiver_id);
            return res.json(result);
        } catch (err) {
            console.error('checkConversation error', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // Lấy type của chat
    async getChatType(req, res) {
        try {
            const { chatId } = req.params;

            if (!chatId) {
                return res.status(400).json({ error: 'chatId là bắt buộc' });
            }

            const meta = await conversationService.getChatMetadata(chatId);
            return res.json({ type: meta.type });
        } catch (err) {
            console.error('getChatType error', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // Cập nhật type của chat
    async updateChatType(req, res) {
        try {
            const { chatId } = req.params;
            const { type } = req.body;

            if (!chatId || !type) {
                return res.status(400).json({ error: 'chatId và type là bắt buộc' });
            }

            if (!['human', 'bot'].includes(type)) {
                return res.status(400).json({ error: 'type phải là "human" hoặc "bot"' });
            }

            const result = await conversationService.updateChatType(chatId, type);
            return res.json(result);
        } catch (err) {
            console.error('updateChatType error', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // Bot mode: Student gửi tin nhắn, bot tự động trả lời
    async sendMessageToBot(req, res) {
        try {
            const { chatId } = req.params;
            const { sender_id, receiver_id, message } = req.body;

            if (!chatId || !message) {
                return res.status(400).json({ error: 'chatId và message là bắt buộc' });
            }

            const result = await conversationService.processBotResponse({
                chatId,
                sender_id,
                receiver_id,
                message
            });

            console.log("📤 Emitting bot response via chatGateway...");
            chatGateway.emitBotResponse(chatId, result.botMessage);

            return res.json(result);
        } catch (err) {
            console.error('sendMessageToBot error', err);
            return res.status(500).json({ error: err.message });
        }
    }

    async getAllHistoriesByUserId(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ error: 'userId là bắt buộc' });
            }
            const histories = await conversationService.getAllHistoriesByUserId(userId);
            return res.json(histories);
        } catch (err) {
            console.error('getAllHistoriesByUserId error', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // API lấy thông báo unread messages
    async getUnreadNotifications(req, res) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({ error: 'userId là bắt buộc' });
            }

            const result = await conversationService.getUnreadNotifications(userId);
            return res.json(result);
        } catch (err) {
            console.error('getUnreadNotifications error', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // API đánh dấu chat đã đọc
    async markChatAsRead(req, res) {
        try {
            const { chatId } = req.params;
            const { userId } = req.body;

            if (!chatId || !userId) {
                return res.status(400).json({ error: 'chatId và userId là bắt buộc' });
            }

            await conversationService.markChatAsRead(chatId, userId);
            return res.json({ success: true });
        } catch (err) {
            console.error('markChatAsRead error', err);
            return res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new ConversationController();