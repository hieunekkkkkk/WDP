const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');

router.post('/check', conversationController.checkConversation);

// Lấy type của chat
router.get('/:chatId/type', conversationController.getChatType);

// Cập nhật type của chat (human/bot)
router.put('/:chatId/type', conversationController.updateChatType);

// Bot mode: Student gửi tin nhắn tới bot
router.post('/:chatId/bot', conversationController.sendMessageToBot);

router.get('/user/:userId/histories', conversationController.getAllHistoriesByUserId);

// API lấy thông báo unread messages
router.get('/user/:userId/unread-notifications', conversationController.getUnreadNotifications);

// API đánh dấu chat đã đọc
router.post('/:chatId/mark-read', conversationController.markChatAsRead);

module.exports = router;