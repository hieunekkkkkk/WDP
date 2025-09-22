const express = require('express');
const router = express.Router();
const AiBotController = require('../controllers/aiBot.controller');

// Tạo bot mới
router.post('/aibot', (req, res) => AiBotController.createBot(req, res));

// Lấy tất cả bot theo owner
router.get('/aibot/owner/:ownerId', (req, res) => AiBotController.getBotsByOwner(req, res));

// Lấy chi tiết bot
router.get('/aibot/:id', (req, res) => AiBotController.getBotById(req, res));

// Cập nhật bot
router.put('/aibot/:id', (req, res) => AiBotController.updateBot(req, res));

// Xóa bot
router.delete('/aibot/:id', (req, res) => AiBotController.deleteBot(req, res));

module.exports = router;


