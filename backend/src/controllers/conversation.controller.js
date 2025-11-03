const conversationService = require('../services/conversation.service');


class ConversationController {
    // Kiểm tra conversation trong Redis
    async checkConversation(req, res) {
        try {
            const { sender_id, receiver_id } = req.body;
            console.log(req.body);
            if (!sender_id || !receiver_id) {
                return res.status(400).json({ error: 'sender_id và receiver_id là bắt buộc' });
            }
            const result = await conversationService.checkOrCreateConversation(sender_id, receiver_id);
            // result: { chatId, sender_messages, receiver_messages }
            return res.json(result);
        } catch (err) {
            console.error('checkConversation error', err);
            return res.status(500).json({ error: err.message });
        }
    };

    // Gửi tin nhắn (bot mode)
    async sendMessage(req, res) {
        try {
            const { chatId } = req.params;
            const type = (req.query.type || 'bot').toLowerCase(); // default bot
            const { message } = req.body;
            if (!chatId || typeof message === 'undefined') {
                return res.status(400).json({ error: 'chatId và message là bắt buộc' });
            }

            // Optionally sender_id/receiver_id may be passed in body to avoid parsing chatId
            const sender_id = req.body.sender_id;
            const receiver_id = req.body.receiver_id;

            const result = await conversationService.processSendMessage({
                chatId,
                sender_id,
                receiver_id,
                message,
                type
            });

            // result contains saved sender message and (if bot) the receiver message (response) or null (if human)
            return res.json(result);
        } catch (err) {
            console.error('sendMessage error', err);
            return res.status(500).json({ error: err.message });
        }
    };

    // Xử lý socket message (human mode)
    async socketSendMessage(data) {
        return await conversationService.processSendMessage({
            chatId: data.chatId,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            message: data.message,
            type: 'human'
        });
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

}

// Xuất instance của class
module.exports = new ConversationController();
