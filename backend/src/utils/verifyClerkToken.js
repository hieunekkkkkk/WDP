
// utils/verifyClerkToken.js
const jwt = require('jsonwebtoken');

async function verifyClerkToken(token) {
    const { jwtVerify, createRemoteJWKSet } = await import('jose');

    const JWKS = createRemoteJWKSet(
        new URL('https://elegant-bunny-94.clerk.accounts.dev/.well-known/jwks.json') // 👈 thay domain thật
    );

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            algorithms: ['RS256'],
            issuer: 'https://elegant-bunny-94.clerk.accounts.dev', // 👈 cùng domain
        });
        return payload;
    } catch (err) {
        console.error('[verifyClerkToken] ❌ Token invalid:', err.message);
        throw new Error('Invalid token');
    }
}

module.exports = { verifyClerkToken };
