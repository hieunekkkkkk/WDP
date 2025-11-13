// middleware/authMiddleware.js
const { verifyClerkToken } = require('../utils/verifyClerkToken');
const { getClerkClient } = require('./clerkClient');
const { getCachedMetadata, setCachedMetadata } = require('../utils/userMetadataCache');

module.exports = async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Missing token' });

        const tokenPayload = await verifyClerkToken(token);
        const userId = tokenPayload.sub;

        // Kiểm tra cache trước
        const cachedMetadata = getCachedMetadata(userId);
        if (cachedMetadata) {
            req.user = {
                ...tokenPayload,
                publicMetadata: cachedMetadata
            };
            return next();
        }

        // Lấy thông tin user đầy đủ từ Clerk API với timeout
        try {
            const clerkClient = await getClerkClient();

            // Thêm timeout cho việc lấy user data
            const fullUser = await Promise.race([
                clerkClient.users.getUser(userId),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Clerk API timeout')), 5000)
                )
            ]);

            const metadata = fullUser.publicMetadata || {};

            // Cache metadata
            setCachedMetadata(userId, metadata);

            // Merge token payload với publicMetadata từ Clerk
            req.user = {
                ...tokenPayload,
                publicMetadata: metadata
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
