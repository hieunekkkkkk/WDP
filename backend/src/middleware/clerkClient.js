// config/clerkClient.js
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// ✅ Tạo Clerk client với timeout configuration
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    apiVersion: 'v1',
    // Thêm timeout cho các API calls
    httpOptions: {
        timeout: 10000, // 10 giây timeout
    }
});

async function getClerkClient() {
    return clerkClient;
}

// ✅ Wrapper với retry logic cho các operations quan trọng
async function withRetry(fn, maxRetries = 2, timeout = 5000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Thêm timeout wrapper
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Operation timeout')), timeout)
                )
            ]);

            if (attempt > 1) {
                console.log(`✅ [ClerkClient] Success on attempt ${attempt}`);
            }

            return result;
        } catch (err) {
            lastError = err;
            console.warn(`⚠️ [ClerkClient] Attempt ${attempt}/${maxRetries} failed:`, err.message);

            // Retry nếu là timeout hoặc network error
            if (attempt < maxRetries && (
                err.message.includes('timeout') ||
                err.message.includes('ETIMEDOUT') ||
                err.message.includes('ECONNRESET') ||
                err.message.includes('ENOTFOUND') ||
                err.code === 'ECONNABORTED'
            )) {
                // Exponential backoff
                const delay = 300 * attempt;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            break;
        }
    }

    throw lastError;
}

// ✅ Get user với timeout và retry
async function getUserWithRetry(userId) {
    return withRetry(() => clerkClient.users.getUser(userId), 2, 5000);
}

// ✅ Update metadata với timeout và retry
async function updateUserMetadataWithRetry(userId, metadata) {
    return withRetry(() => clerkClient.users.updateUserMetadata(userId, metadata), 2, 5000);
}

async function verifyClerkToken(token) {
    try {
        const payload = await clerkClient.verifyToken(token);
        return payload;
    } catch (err) {
        console.error('[Clerk SDK] ❌ Token verification failed:', err.message);
        throw err;
    }
}

module.exports = {
    getClerkClient,
    verifyClerkToken,
    getUserWithRetry,
    updateUserMetadataWithRetry,
};
