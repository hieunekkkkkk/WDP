
// utils/verifyClerkToken.js

// ✅ Cache JWKS để tránh fetch lại nhiều lần
let cachedJWKS = null;
let jwksInitPromise = null;

async function initJWKS() {
    if (cachedJWKS) return cachedJWKS;

    if (jwksInitPromise) return jwksInitPromise;

    jwksInitPromise = (async () => {
        const { createRemoteJWKSet } = await import('jose');

        const JWKS_URL = 'https://elegant-bunny-94.clerk.accounts.dev/.well-known/jwks.json';

        // Tạo JWKS với cache và timeout
        cachedJWKS = createRemoteJWKSet(new URL(JWKS_URL), {
            cacheMaxAge: 3600000, // Cache 1 giờ
            cooldownDuration: 30000, // Cooldown 30s giữa các request
            timeoutDuration: 5000, // Timeout 5s cho mỗi request
        });

        console.log('✅ [verifyClerkToken] JWKS initialized and cached');
        return cachedJWKS;
    })();

    return jwksInitPromise;
}

async function verifyClerkToken(token) {
    const { jwtVerify } = await import('jose');

    const JWKS = createRemoteJWKSet(
        new URL('https://clerk.smearch.io.vn/.well-known/jwks.json') // 
    );

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            algorithms: ['RS256'],
            issuer: 'https://clerk.smearch.io.vn', 
        });
        return payload;
    } catch (err) {
        console.error('[verifyClerkToken] ❌ Token invalid:', err.message);
        throw new Error('Invalid token');
    }
}

module.exports = { verifyClerkToken };
