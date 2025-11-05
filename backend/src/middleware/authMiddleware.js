// middleware/authMiddleware.js
const { verifyClerkToken } = require('../utils/verifyClerkToken');

module.exports = async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Missing token' });

        const user = await verifyClerkToken(token);
        req.user = user;

        next();
    } catch (err) {
        console.error('[AuthMiddleware] ❌', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
