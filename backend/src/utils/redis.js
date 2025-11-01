const Redis = require("ioredis");
require("dotenv").config({ path: ".env.dev" });

// Config kết nối Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  // db: process.env.REDIS_DB || 0,
  retryStrategy(times) {
    // Thời gian reconnect tăng dần: 500ms, 1s, 2s...
    return Math.min(times * 500, 2000);
  },
});

// Log sự kiện kết nối
redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

/**
 * Hàm tiện ích Redis
 */
const RedisClient = {
  // Key-Value
  async set(key, value, expireSec) {
    if (expireSec) {
      return await redis.set(key, JSON.stringify(value), "EX", expireSec);
    }
    return await redis.set(key, JSON.stringify(value));
  },

  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async del(key) {
    return await redis.del(key);
  },

  // Hash
  async hset(key, field, value) {
    return await redis.hset(key, field, JSON.stringify(value));
  },

  async hget(key, field) {
    const data = await redis.hget(key, field);
    return data ? JSON.parse(data) : null;
  },

  async hgetall(key) {
    const data = await redis.hgetall(key);
    Object.keys(data).forEach((field) => {
      try {
        data[field] = JSON.parse(data[field]);
      } catch {
        // nếu value không phải JSON thì giữ nguyên
      }
    });
    return data;
  },

  async hdel(key, field) {
    return await redis.hdel(key, field);
  },

  // List
  async lpush(key, value) {
    return await redis.lpush(key, JSON.stringify(value));
  },

  async rpush(key, value) {
    return await redis.rpush(key, JSON.stringify(value));
  },

  async lrange(key, start = 0, stop = -1) {
    const list = await redis.lrange(key, start, stop);
    return list.map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    });
  },

  async llen(key) {
    return await redis.llen(key);
  },

  async expire(key, seconds) {
    return await redis.expire(key, seconds);
  },

  // Pub/Sub
  publish(channel, message) {
    return redis.publish(channel, JSON.stringify(message));
  },

  subscribe(channel, callback) {
    const subscriber = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || 6379,

      db: process.env.REDIS_DB || 0,
    });

    subscriber.subscribe(channel);
    subscriber.on("message", (ch, message) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(message));
        } catch {
          callback(message);
        }
      }
    });

    return subscriber;
  },
};

module.exports = RedisClient;
