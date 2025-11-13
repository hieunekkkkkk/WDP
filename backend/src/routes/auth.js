// routes/auth.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { updateUserMetadataWithRetry } = require('../middleware/clerkClient');
const { invalidateCache } = require('../utils/userMetadataCache');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const decoded = req.user;
        const userId = decoded.sub;

        // Lấy role hiện tại từ publicMetadata hoặc từ request body
        let userRole = decoded.publicMetadata?.role || role;

        // Nếu FE gửi role và chưa có trong publicMetadata, cập nhật vào Clerk
        if (role && !decoded.publicMetadata?.role) {
            try {
                // Sử dụng function có retry và timeout
                await updateUserMetadataWithRetry(userId, {
                    publicMetadata: {
                        ...decoded.publicMetadata,
                        role: role
                    }
                });

                userRole = role;

                // Invalidate cache sau khi update
                invalidateCache(userId);

                console.log(`✅ [Auth Route] Updated role for user ${userId}: ${role}`);
            } catch (clerkError) {
                console.error('[Auth Route] ❌ Failed to update Clerk metadata:', clerkError.message);
                // Vẫn tiếp tục xử lý, chỉ log lỗi
                // Nếu update fail, vẫn dùng role từ FE
                if (role) {
                    userRole = role;
                }
            }
        }

        // JWT Clerk payload đã có thông tin cơ bản:
        const claims = {
            userId: userId,
            email: decoded.email_address || decoded.email,
            role: userRole,
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
