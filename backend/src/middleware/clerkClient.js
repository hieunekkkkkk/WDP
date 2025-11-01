// src/clerkClient.js
const { Clerk } = require('@clerk/clerk-sdk-node');

let clerkInstance;

function getClerkInstance() {
    if (!clerkInstance) {
        console.log('[Clerk] Initializing new Clerk instance...');
        clerkInstance = new Clerk({
            secretKey: process.env.CLERK_SECRET_KEY,
            // apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.com',
            retryAttempts: 3, // thử lại nếu request thất bại
            retryInitialDelay: 500, // 0.5s delay
        });
    }
    return clerkInstance;
}

// Auto reconnect nếu Clerk gặp lỗi fetch
async function ensureClerkConnection() {
    try {
        const clerk = getClerkInstance();
        await clerk.users.getUserList({ limit: 1 }); // test 1 request đơn giản
        return clerk;
    } catch (error) {
        console.warn('[Clerk] Connection lost. Retrying...');
        clerkInstance = null; // reset instance
        return getClerkInstance(); // tái khởi tạo
    }
}

module.exports = {
    getClerkInstance,
    ensureClerkConnection,
};
