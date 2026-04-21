const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
  socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
});

redisClient.on('error', (err) => {
  console.warn('[Redis] Connection error (non-fatal):', err.message);
});
redisClient.on('connect', () => console.log('[Redis] Connected'));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
  } catch (err) {
    console.warn('[Redis] Could not connect — running without cache:', err.message);
  }
};

const cacheGet = async (key) => { try { return await redisClient.get(key); } catch { return null; } };
const cacheSet = async (key, value, ttl = 300) => { try { await redisClient.set(key, value, { EX: ttl }); } catch {} };
const cacheDel = async (key) => { try { await redisClient.del(key); } catch {} };

module.exports = { redisClient, connectRedis, cacheGet, cacheSet, cacheDel };
