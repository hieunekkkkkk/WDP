let cachedJWKS = null;
let jwksInitPromise = null;

async function initJWKS() {
    if (cachedJWKS) return cachedJWKS;

    if (jwksInitPromise) return jwksInitPromise;

    jwksInitPromise = (async () => {
        const { createRemoteJWKSet } = await import('jose');

        const JWKS_URL = 'https://clerk.smearch.io.vn/.well-known/jwks.json';

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

    const ISSUER = 'https://clerk.smearch.io.vn';
    const MAX_RETRIES = 2;
    let lastError;

    // Khởi tạo JWKS với cache
    const JWKS = await initJWKS();

    // Retry logic
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const { payload } = await Promise.race([
                jwtVerify(token, JWKS, {
                    algorithms: ['RS256'],
                    issuer: ISSUER,
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('JWT verification timeout')), 8000)
                )
            ]);

            if (attempt > 1) {
                console.log(`✅ [verifyClerkToken] Success on attempt ${attempt}`);
            }

            return payload;
        } catch (err) {
            lastError = err;
            console.warn(`⚠️ [verifyClerkToken] Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);

            // Nếu là lỗi timeout hoặc network, retry
            if (attempt < MAX_RETRIES && (
                err.message.includes('timeout') ||
                err.message.includes('timed out') ||
                err.message.includes('ETIMEDOUT') ||
                err.message.includes('ECONNRESET')
            )) {
                // Exponential backoff: 500ms, 1000ms
                const delay = 500 * attempt;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Nếu không phải lỗi network hoặc hết retry, throw
            break;
        }
    }

    console.error('[verifyClerkToken] ❌ All attempts failed:', lastError.message);
    throw new Error('Token verification failed');
}

module.exports = { verifyClerkToken };
