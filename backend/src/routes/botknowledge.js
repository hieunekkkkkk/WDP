const BotKnowledgeController = require('../controllers/botknowledge.controller');
const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Tạo kiến thức mới
router.post('/:aibot_id', upload.single('file'), (req, res) => BotKnowledgeController.createKnowledge(req, res));

// Lấy danh sách kiến thức
router.get('/', (req, res) => BotKnowledgeController.getKnowledges(req, res));

// Cập nhật kiến thức
router.put('/:id', (req, res) => BotKnowledgeController.updateKnowledge(req, res));

// Xoá kiến thức
router.delete('/:id', (req, res) => BotKnowledgeController.deleteKnowledge(req, res));


module.exports = router;