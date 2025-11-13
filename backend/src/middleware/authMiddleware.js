// middleware/authMiddleware.js
const { verifyClerkToken } = require('../utils/verifyClerkToken');
const { getClerkClient } = require('./clerkClient');

module.exports = async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Missing token' });

        const tokenPayload = await verifyClerkToken(token);

        // Lấy thông tin user đầy đủ từ Clerk API để có publicMetadata
        try {
            const clerkClient = await getClerkClient();
            const fullUser = await clerkClient.users.getUser(tokenPayload.sub);

            // Merge token payload với publicMetadata từ Clerk
            req.user = {
                ...tokenPayload,
                publicMetadata: fullUser.publicMetadata || {}
            };
        } catch (clerkError) {
            console.warn('[AuthMiddleware] ⚠️ Could not fetch full user data:', clerkError.message);
            // Fallback: chỉ dùng token payload
            req.user = {
                ...tokenPayload,
                publicMetadata: {}
            };
        }

        next();
    } catch (err) {
        console.error('[AuthMiddleware] ❌', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
