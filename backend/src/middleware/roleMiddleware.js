const requireRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role; // Lấy role từ decoded token
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = requireRole;