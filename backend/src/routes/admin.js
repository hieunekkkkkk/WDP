const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, requireRole(['admin']), (req, res) => {
    res.json({
        message: 'This is an admin-only route',
        user: req.user
    });
});

module.exports = router;