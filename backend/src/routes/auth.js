// routes/auth.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const decoded = req.user;

        // JWT Clerk payload đã có thông tin cơ bản:
        const claims = {
            userId: decoded.sub,
            email: decoded.email_address || decoded.email,
            role: decoded.role || role || 'client',
            username: decoded.username || '',
            image: decoded.image_url || '',
        };

        res.json({
            accessToken: req.headers.authorization.split(' ')[1],
            claims,
        });
    } catch (error) {
        console.error('[Auth Route] Error:', error.message);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

module.exports = router;
