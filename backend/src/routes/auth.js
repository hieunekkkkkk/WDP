// routes/auth.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getClerkClient } = require('../middleware/clerkClient');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const decoded = req.user;

        const clerk = await getClerkClient();
        let user = await clerk.users.getUser(decoded.sub);

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
        console.error('[Auth Route] Error:', error.message);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

module.exports = router;
