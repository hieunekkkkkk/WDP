const { Clerk } = require('@clerk/clerk-sdk-node');

// Khởi tạo Clerk với secret key
const clerk = new Clerk({
    secretKey: process.env.CLERK_SECRET_KEY,
});

// Middleware xác thực JWT
const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Xác minh token với Clerk
        const decoded = await clerk.verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Lưu thông tin user vào req để sử dụng ở các route sau
        req.user = decoded; // decoded chứa các claims như userId, role, v.v.
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Unauthorized access' });
    }
};

module.exports = authMiddleware;