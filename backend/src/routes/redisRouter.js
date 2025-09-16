const express = require('express');
const { createClient } = require('redis');
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev' });

const router = express.Router();

// Tạo client Redis
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

// Xử lý lỗi Redis
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Kết nối Redis
(async () => {
    await redisClient.connect();
})();

// Route lưu dữ liệu
router.post('/set', async (req, res) => {
    const { key, value } = req.body;
    try {
        await redisClient.set(key, value);
        res.json({ message: `Set key ${key} with value ${value}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route lấy dữ liệu
router.get('/get/:key', async (req, res) => {
    const { key } = req.params;
    try {
        const value = await redisClient.get(key);
        res.json({ key, value: value || 'Not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route lấy tất cả keys
router.get('/keys', async (req, res) => {
    try {
        const keys = await redisClient.keys('*');
        res.json({ keys });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;