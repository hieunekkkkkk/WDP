const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');

// REST API (bot mode)
router.get('/check', conversationController.checkConversation);

router.post('/:chatId', conversationController.sendMessage);

module.exports = router;
