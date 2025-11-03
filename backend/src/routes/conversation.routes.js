const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');

// REST API (bot mode)
router.post('/check', conversationController.checkConversation);

router.post('/:chatId', conversationController.sendMessage);

router.get('/user/:userId/histories', conversationController.getAllHistoriesByUserId);

module.exports = router;
