const express = require('express');
const router = express.Router();
const multer = require('multer');
const BusinessRevenueController = require('../controllers/businessRevenue.controller');

const upload = multer({ storage: multer.memoryStorage() });

// Thêm revenue mới
router.post('/business/:id/revenue', (req, res) => BusinessRevenueController.createRevenue(req, res));

// Lấy tất cả revenue của 1 business
router.get('/business/:id/revenues', (req, res) => BusinessRevenueController.getRevenues(req, res));

// Lấy revenue trong khoảng ngày
router.get('/business/:id/revenues/range', (req, res) => BusinessRevenueController.getRevenuesInRange(req, res));

// Import revenue từ file Excel
router.post('/business/:id/revenues/import', upload.single('file'), (req, res) => BusinessRevenueController.importRevenues(req, res));

module.exports = router;

