// config/clerkClient.js
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    apiVersion: 'v1',
    // apiUrl: 'https://api.clerk.dev' // optional, default is fine
});

async function getClerkClient() {
    return clerkClient;
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
};
