const { getClerkClient } = require('./clerkClient');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const clerk = await getClerkClient();

        const decoded = await clerk.verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('[AuthMiddleware] Token verification error:', error.message);

        // Nếu lỗi là do mất kết nối Clerk API
        if (error.message.includes('fetch failed') || error.code === 'ECONNREFUSED') {
            // reset clerkClient để tự reconnect lần sau
            const { getClerkClient } = require('./clerkClient');
            getClerkClient();
        }

        return res.status(401).json({ error: 'Unauthorized access' });
    }
};

module.exports = authMiddleware;
