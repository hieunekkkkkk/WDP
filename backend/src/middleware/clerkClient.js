// config/clerkClient.js
const { Clerk } = require('@clerk/clerk-sdk-node');

let clerkClient;
let lastInit = 0;

function initClerkClient() {
    try {
        clerkClient = Clerk({
            secretKey: process.env.CLERK_SECRET_KEY,
            // apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.dev',
            apiVersion: 'v1',
        });

        lastInit = Date.now();
        console.log(`[Clerk SDK] ✅ Client initialized (${new Date().toISOString()})`);
        return clerkClient;
    } catch (err) {
        console.error('[Clerk SDK] ❌ Failed to initialize:', err.message);
        clerkClient = null;
        return null;
    }
}

async function getClerkClient(retry = 0) {
    // Re-init nếu client null hoặc lâu hơn 5 phút
    if (!clerkClient || Date.now() - lastInit > 5 * 60 * 1000) {
        console.warn('[Clerk SDK] ⚠️ Reinitializing client...');
        clerkClient = initClerkClient();
    }

    try {
        // Test nhẹ để đảm bảo client còn hoạt động
        await clerkClient.users.getUserList({ limit: 1 });
        return clerkClient;
    } catch (err) {
        if (retry < 2) {
            console.warn(`[Clerk SDK] ⚠️ API check failed (${err.message}). Retrying...`);
            await new Promise((r) => setTimeout(r, 500 * (retry + 1)));
            clerkClient = initClerkClient();
            return getClerkClient(retry + 1);
        }

        console.error('[Clerk SDK] ❌ Clerk API unreachable after retries:', err.message);
        throw new Error('Clerk API unavailable');
    }
}

// ✅ Hàm xác minh token (JWKS caching tự động)
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
};
