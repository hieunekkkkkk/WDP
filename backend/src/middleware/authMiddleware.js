// src/middleware/authMiddleware.js
const { ensureClerkConnection } = require('./clerkClient');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const clerk = await ensureClerkConnection();

        const decoded = await clerk.verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('[AuthMiddleware] Token verification error:', error.message);
        if (error.message.includes('fetch failed')) {
            console.warn('[AuthMiddleware] Clerk API unreachable. Retrying connection...');
        }
        return res.status(401).json({ error: 'Unauthorized access' });
    }
};

module.exports = authMiddleware;
