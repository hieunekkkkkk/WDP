// config/clerkClient.js
const { createClerkClient } = require('@clerk/backend');

let clerkClient;
let lastInit = 0;

function initClerkClient() {
    try {
        clerkClient = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY,
            apiUrl: process.env.CLERK_API_URL || 'https://api.clerk.dev',
            apiVersion: 'v1',
        });

        lastInit = Date.now();
        console.log(`[Clerk] ✅ Client initialized (${new Date().toISOString()})`);
        return clerkClient;
    } catch (err) {
        console.error('[Clerk] ❌ Failed to initialize:', err.message);
        clerkClient = null;
        return null;
    }
}

async function getClerkClient(retry = 0) {
    // Re-init nếu client null hoặc lâu hơn 5 phút
    if (!clerkClient || Date.now() - lastInit > 5 * 60 * 1000) {
        console.warn('[Clerk] ⚠️ Reinitializing client...');
        clerkClient = initClerkClient();
    }

    try {
        // Test gọi nhẹ để chắc client hoạt động (không block chính)
        await clerkClient.users.getUserList({ limit: 1 });
        return clerkClient;
    } catch (err) {
        if (retry < 2) {
            console.warn(`[Clerk] ⚠️ API check failed (${err.message}). Retrying...`);
            await new Promise((r) => setTimeout(r, 500 * (retry + 1)));
            clerkClient = initClerkClient();
            return getClerkClient(retry + 1);
        }
        console.error('[Clerk] ❌ Clerk API unreachable:', err.message);
        throw new Error('Clerk API unavailable');
    }
}

module.exports = { getClerkClient };
