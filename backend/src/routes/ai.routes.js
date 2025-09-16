const AiController = require('../controllers/ai.controller');
const express = require('express');
const router = express.Router();

router.get('/data', AiController.getAllBusinessWithProducts.bind(AiController));
router.get('/recommend', AiController.recommend.bind(AiController));

module.exports = router;