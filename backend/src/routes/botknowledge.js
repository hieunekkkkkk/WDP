const BotKnowledgeController = require("../controllers/botknowledge.controller");
const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Lấy danh sách kiến thức (tất cả bot)
router.get("/", (req, res) => BotKnowledgeController.getKnowledges(req, res));
// Sau đó mới tới GET theo bot cụ thể
router.get("/:aibot_id", (req, res) =>
  BotKnowledgeController.getKnowledgeByBotId(req, res)
);
// Tạo kiến thức mới
router.post("/:aibot_id", upload.single("file"), (req, res) =>
  BotKnowledgeController.createKnowledge(req, res)
);

// Cập nhật kiến thức
router.put("/:id", (req, res) =>
  BotKnowledgeController.updateKnowledge(req, res)
);

// Xoá kiến thức
router.delete("/:id", (req, res) =>
  BotKnowledgeController.deleteKnowledge(req, res)
);

module.exports = router;
