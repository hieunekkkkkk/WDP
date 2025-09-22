const express = require('express');
const router = express.Router();
const BusinessViewController = require('../controllers/businessView.controller');

// tăng view cho business
router.post('/business/:id/view', (req, res) => BusinessViewController.addView(req, res));

// lấy thống kê view theo ngày (dashboard chart)
router.get('/business/:id/views', (req, res) => BusinessViewController.getViewsInRange(req, res));

module.exports = router;

