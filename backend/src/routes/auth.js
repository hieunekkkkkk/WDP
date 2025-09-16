const express = require('express');
const { Clerk } = require('@clerk/clerk-sdk-node');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

const router = express.Router();

// Khởi tạo Clerk
const clerk = new Clerk({
    secretKey: process.env.CLERK_SECRET_KEY,
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const decoded = req.user;
        let user = await clerk.users.getUser(decoded.sub);
        if (!user.publicMetadata?.role) {
            await clerk.users.updateUser(decoded.sub, {
                publicMetadata: {
                    ...user.publicMetadata,
                    role: 'client',
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
                image: user.imageUrl || ''
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

module.exports = router;