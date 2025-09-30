// services/conversationService.js
const redis = require('../utils/redis');
const aibotService = require('../services/aibot.service');

const EXPIRE_SEC = 60 * 60 * 24; // 1 ngày

class ConversationService {
    buildChatId(sender_id, receiver_id) {
        return `${sender_id}_${receiver_id}`;
    }

    async checkOrCreateConversation(sender_id, receiver_id) {
        const chatId = this.buildChatId(sender_id, receiver_id);

        const senderKey = `chat:${chatId}:sender:${sender_id}:messages`;
        const receiverKey = `chat:${chatId}:receiver:${receiver_id}:messages`;
        const historyKey = `chat:${chatId}:messages`;

        const [sender_messages, receiver_messages, history] = await Promise.all([
            redis.lrange(senderKey, 0, -1),
            redis.lrange(receiverKey, 0, -1),
            redis.lrange(historyKey, 0, -1)
        ]);

        return {
            chatId,
            sender_messages: sender_messages || [],
            receiver_messages: receiver_messages || [],
            history
        };
    }

    async processSendMessage({ chatId, sender_id, receiver_id, message, type = 'bot' }) {
        let sId = sender_id;
        let rId = receiver_id;

        if (!sId || !rId) {
            const parts = chatId.split('_');
            if (parts.length !== 2) {
                throw new Error('Invalid chatId format. Expected "<sender>_<receiver>"');
            }
            if (!sId) sId = parts[0];
            if (!rId) rId = parts[1];
        }

        const senderKey = `chat:${chatId}:sender:${sId}:messages`;
        const receiverKey = `chat:${chatId}:receiver:${rId}:messages`;
        const historyKey = `chat:${chatId}:messages`;

        const senderMsgObj = {
            sender_id: sId,
            receiver_id: rId,
            message,
            ts: Date.now(),
            type: 'sent'
        };

        // Lưu tin nhắn sender + set TTL
        await Promise.all([
            redis.rpush(senderKey, senderMsgObj),
            redis.expire(senderKey, EXPIRE_SEC),
            redis.rpush(historyKey, senderMsgObj),
            redis.expire(historyKey, EXPIRE_SEC)
        ]);

        if (type === 'bot') {
            const bots = await aibotService.getBotsByOwner(rId);
            const bot = (bots && bots.length) ? bots[0] : null;
            let botResponseText;

            if (bot) {
                botResponseText = await aibotService.handleMessage(bot, message);
            } else {
                botResponseText = `No bot configured for owner ${rId}`;
            }

            const botMsgObj = {
                sender_id: rId,
                receiver_id: sId,
                message: botResponseText,
                ts: Date.now(),
                type: 'bot_response'
            };

            // Lưu tin nhắn bot + set TTL
            await Promise.all([
                redis.rpush(receiverKey, botMsgObj),
                redis.expire(receiverKey, EXPIRE_SEC),
                redis.rpush(historyKey, botMsgObj),
                redis.expire(historyKey, EXPIRE_SEC)
            ]);

            return {
                chatId,
                senderMessage: senderMsgObj,
                receiverMessage: botMsgObj
            };
        } else if (type === 'human') {
            return {
                chatId,
                senderMessage: senderMsgObj,
                receiverMessage: null
            };
        } else {
            throw new Error('Unsupported message type. Expected "bot" or "human"');
        }
    }
}

module.exports = new ConversationService();
