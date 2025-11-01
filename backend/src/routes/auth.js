// src/routes/auth.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { ensureClerkConnection } = require('../middleware/clerkClient');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const decoded = req.user;
        const clerk = await ensureClerkConnection();

        let user = await clerk.users.getUser(decoded.sub);

        // Nếu user chưa có role thì cập nhật
        if (!user.publicMetadata?.role) {
            await clerk.users.updateUser(decoded.sub, {
                publicMetadata: {
                    ...user.publicMetadata,
                    role: role || 'client',
                },
            });
            user = await clerk.users.getUser(decoded.sub);
        }

        res.json({
            accessToken: req.headers.authorization.split(' ')[1],
            claims: {
                userId: decoded.sub,
                email: decoded.email,
                role: user.publicMetadata.role,
                username: user.username || '',
                image: user.imageUrl || '',
            },
        });
    } catch (error) {
        console.error('[AuthRoute] Clerk API error:', error.message);

        // Nếu lỗi liên quan đến Clerk API, thử tái kết nối
        if (error.message.includes('fetch failed')) {
            console.warn('[AuthRoute] Clerk API disconnected. Reinitializing...');
            await ensureClerkConnection(); // reset lại
            return res.status(503).json({ error: 'Clerk temporarily unavailable. Please try again.' });
        }

        res.status(500).json({ error: 'Authentication failed' });
    }
});

module.exports = router;
