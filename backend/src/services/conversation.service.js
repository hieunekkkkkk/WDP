const redis = require('../utils/redis');
const aibotService = require('../services/aibot.service');
const Chat = require('../entity/module/chat.model');

const EXPIRE_SEC = 60 * 60 * 24; // 1 ngày

class ConversationService {
    buildChatId(sender_id, receiver_id) {
        return `${sender_id}_${receiver_id}`;
    }

    async checkOrCreateConversation(sender_id, receiver_id) {
        const chatId = this.buildChatId(sender_id, receiver_id);

        // Tạo document trong MongoDB nếu chưa có
        let existingChat = await Chat.findOne({ chatId });
        if (!existingChat) {
            existingChat = await Chat.create({
                chatId,
                senderId: sender_id,
                receiverId: receiver_id,
                type: 'human' // Mặc định là human
            });
        }

        // Lưu metadata vào Redis
        const metaKey = `chat:${chatId}:meta`;
        await redis.set(metaKey, {
            senderId: sender_id,
            receiverId: receiver_id,
            chatId,
            type: existingChat.type
        }, EXPIRE_SEC);

        // Lấy history từ Redis
        const historyKey = `chat:${chatId}:messages`;
        const history = await redis.lrange(historyKey, 0, -1);

        return {
            chatId,
            type: existingChat.type,
            history: history || []
        };
    }

    async getChatMetadata(chatId) {
        const metaKey = `chat:${chatId}:meta`;
        let meta = await redis.get(metaKey);

        if (!meta) {
            const chat = await Chat.findOne({ chatId });
            if (!chat) {
                throw new Error('Chat not found');
            }

            meta = {
                senderId: chat.senderId,
                receiverId: chat.receiverId,
                chatId: chat.chatId,
                type: chat.type
            };

            await redis.set(metaKey, meta, EXPIRE_SEC);
        }

        return meta;
    }

    // Cập nhật type của chat
    async updateChatType(chatId, type) {
        const chat = await Chat.findOneAndUpdate(
            { chatId },
            { type },
            { new: true }
        );

        if (!chat) {
            throw new Error('Chat not found');
        }

        // Cập nhật Redis
        const metaKey = `chat:${chatId}:meta`;
        const meta = await redis.get(metaKey);
        if (meta) {
            meta.type = type;
            await redis.set(metaKey, meta, EXPIRE_SEC);
        }

        return chat;
    }

    async saveMessage({ chatId, sender_id, receiver_id, message, message_who }) {
        let sId = sender_id;
        let rId = receiver_id;

        if (!sId || !rId) {
            const meta = await this.getChatMetadata(chatId);
            if (!sId) sId = meta.senderId;
            if (!rId) rId = meta.receiverId;
        }

        const historyKey = `chat:${chatId}:messages`;

        const msgObj = {
            sender_id: sId,
            receiver_id: rId,
            message,
            message_who, // 'sender' hoặc 'receiver'
            ts: Date.now()
        };

        await Promise.all([
            redis.rpush(historyKey, msgObj),
            redis.expire(historyKey, EXPIRE_SEC)
        ]);

        return msgObj;
    }

    // Xử lý bot response
    async processBotResponse({ chatId, sender_id, receiver_id, message }) {
        let sId = sender_id;
        let rId = receiver_id;

        if (!sId || !rId) {
            const meta = await this.getChatMetadata(chatId);
            if (!sId) sId = meta.senderId;
            if (!rId) rId = meta.receiverId;
        }

        console.log("🤖 Processing bot response for chat:", chatId);
        console.log("⚠️ Note: Student message should be emitted via socket first, not saved here");

        // KHÔNG LƯU student message nữa (socket đã lưu rồi)
        // Chỉ gọi bot để lấy response
        try {
            const bots = await aibotService.getBotsByOwner(rId);
            console.log("🔍 Bot found:", bots ? "Yes" : "No");

            let botResponseText;

            if (bots && bots.knowledge && Array.isArray(bots.knowledge) && bots.knowledge.length > 0) {
                console.log("🎯 Calling bot handleMessage...");
                const botResult = await aibotService.handleMessage(bots.id, message, chatId);
                botResponseText = botResult.response || botResult;
                console.log("✅ Bot response received:", botResponseText);
            } else {
                console.warn("⚠️ Bot has no knowledge");
                botResponseText = `Xin lỗi, doanh nghiệp chưa cấu hình bot tự động.`;
            }

            // Lưu tin nhắn bot
            const botMsg = await this.saveMessage({
                chatId,
                sender_id: rId,
                receiver_id: sId,
                message: botResponseText,
                message_who: 'receiver'
            });

            console.log("✅ Bot message saved:", botMsg);

            return {
                chatId,
                botMessage: botMsg
            };
        } catch (err) {
            console.error("❌ Error processing bot response:", err);

            // Trả về error message
            const errorMsg = await this.saveMessage({
                chatId,
                sender_id: rId,
                receiver_id: sId,
                message: "Xin lỗi, bot đang gặp sự cố. Vui lòng thử lại sau.",
                message_who: 'receiver'
            });

            return {
                chatId,
                botMessage: errorMsg
            };
        }
    }

    async getAllHistoriesByUserId(userId) {
        const chats = await Chat.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
        }).lean();

        if (!chats.length) return [];

        const results = await Promise.all(
            chats.map(async (chat) => {
                const historyKey = `chat:${chat.chatId}:messages`;
                const messages = await redis.lrange(historyKey, 0, -1);

                return {
                    chatId: chat.chatId,
                    senderId: chat.senderId,
                    receiverId: chat.receiverId,
                    type: chat.type,
                    conversation: messages,
                };
            })
        );

        return results;
    }

    /**
     * Lấy thông tin unread messages cho notification
     * @param {string} userId - ID của user hiện tại
     * @returns {Promise<Object>} { totalUnread, chats: [...] }
     */
    async getUnreadNotifications(userId) {
        // Tìm tất cả chat của user
        const chats = await Chat.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
        }).lean();

        if (!chats.length) {
            return { totalUnread: 0, chats: [] };
        }

        let totalUnread = 0;
        const unreadChats = [];

        await Promise.all(
            chats.map(async (chat) => {
                const historyKey = `chat:${chat.chatId}:messages`;
                const messages = await redis.lrange(historyKey, 0, -1);

                if (!messages || messages.length === 0) return;

                // Lọc messages từ người khác gửi (chưa đọc)
                const unreadMessages = messages.filter(msg => {
                    return msg.sender_id !== userId;
                });

                if (unreadMessages.length > 0) {
                    const lastUnreadMsg = unreadMessages[unreadMessages.length - 1];

                    // Xác định sender info
                    const senderId = lastUnreadMsg.sender_id;
                    const isUserSender = chat.senderId === userId;
                    const otherUserId = isUserSender ? chat.receiverId : chat.senderId;

                    totalUnread += unreadMessages.length;

                    unreadChats.push({
                        chatId: chat.chatId,
                        senderId: chat.senderId,
                        receiverId: chat.receiverId,
                        otherUserId, // ID của người chat với mình
                        unreadCount: unreadMessages.length,
                        lastMessage: {
                            sender_id: lastUnreadMsg.sender_id,
                            message: lastUnreadMsg.message,
                            ts: lastUnreadMsg.ts
                        }
                    });
                }
            })
        );

        // Sort theo thời gian mới nhất
        unreadChats.sort((a, b) => b.lastMessage.ts - a.lastMessage.ts);

        return {
            totalUnread,
            chats: unreadChats
        };
    }

    /**
     * Đánh dấu messages của 1 chat là đã đọc
     * @param {string} chatId 
     * @param {string} userId - User đang đọc messages (xóa unread của user này)
     */
    async markChatAsRead(chatId, userId) {
        // Logic: Khi user vào xem chat, tất cả messages từ người khác sẽ bị xóa khỏi Redis
        // Điều này có nghĩa là messages đó đã được "đọc"
        const historyKey = `chat:${chatId}:messages`;
        const messages = await redis.lrange(historyKey, 0, -1);

        if (!messages || messages.length === 0) return;

        // Xóa toàn bộ messages từ người khác (tức là đánh dấu đã đọc)
        // Giữ lại messages của chính mình
        const updatedMessages = messages.filter(msg => {
            return msg.sender_id === userId;
        });

        // Xóa list cũ
        await redis.del(historyKey);

        // Push lại chỉ messages của chính mình
        if (updatedMessages.length > 0) {
            await redis.rpush(historyKey, ...updatedMessages);
            await redis.expire(historyKey, EXPIRE_SEC);
        }

        console.log(`✅ Chat ${chatId} marked as read for user ${userId}`);
    }
}

module.exports = new ConversationService();