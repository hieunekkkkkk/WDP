const express = require('express');
const router = express.Router();
const multer = require('multer');
const BusinessRevenueController = require('../controllers/businessRevenue.controller');

const upload = multer({ storage: multer.memoryStorage() });

// Thêm revenue mới
router.post('/:id/business_revenue', (req, res) => BusinessRevenueController.createRevenue(req, res));

// Lấy tất cả revenue của 1 business
router.get('/:id/business_revenues', (req, res) => BusinessRevenueController.getRevenues(req, res));

// Lấy revenue trong khoảng ngày
router.get('/:id/business_revenues/range', (req, res) => BusinessRevenueController.getRevenuesInRange(req, res));

// Import revenue từ file Excel
router.post('/:id/business_revenues/import', upload.single('file'), (req, res) => BusinessRevenueController.importRevenues(req, res));

// Lấy 1 revenue theo ID
router.get('/:id/business_revenue', (req, res) => BusinessRevenueController.getRevenueById(req, res));

// Cập nhật 1 revenue theo ID
router.put('/:id/business_revenue', (req, res) => BusinessRevenueController.updateRevenue(req, res));

// delete
router.delete('/:id/business_revenues', BusinessRevenueController.deleteBusinessRevenue);



module.exports = router;

