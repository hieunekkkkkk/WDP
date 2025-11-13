// utils/userMetadataCache.js

// ✅ Cache user metadata tập trung
const userMetadataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

function getCachedMetadata(userId) {
    const cached = userMetadataCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCachedMetadata(userId, metadata) {
    userMetadataCache.set(userId, {
        data: metadata,
        timestamp: Date.now()
    });
}

function invalidateCache(userId) {
    if (userId) {
        userMetadataCache.delete(userId);
        console.log(`🗑️ [Cache] Invalidated cache for user ${userId}`);
    } else {
        userMetadataCache.clear();
        console.log('🗑️ [Cache] Cleared all user metadata cache');
    }
}

// Cleanup cache mỗi 10 phút
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [userId, cache] of userMetadataCache.entries()) {
        if (now - cache.timestamp > CACHE_TTL) {
            userMetadataCache.delete(userId);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`🧹 [Cache] Cleaned ${cleaned} expired entries`);
    }
}, 10 * 60 * 1000);

module.exports = {
    getCachedMetadata,
    setCachedMetadata,
    invalidateCache
};
