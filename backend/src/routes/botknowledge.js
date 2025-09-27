const BotKnowledgeController = require('../controllers/botknowledge.controller');
const express = require('express');
const router = express.Router();

// Tạo kiến thức mới
router.post('/:aibot_id', (req, res) => BotKnowledgeController.createKnowledge(req, res));

// Lấy danh sách kiến thức
router.get('/', (req, res) => BotKnowledgeController.getKnowledges(req, res));

// Cập nhật kiến thức
router.put('/:id', (req, res) => BotKnowledgeController.updateKnowledge(req, res));

// Xoá kiến thức
router.delete('/:id', (req, res) => BotKnowledgeController.deleteKnowledge(req, res));


module.exports = router;