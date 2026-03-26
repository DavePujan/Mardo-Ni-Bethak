const Redis = require('ioredis');

const retryStrategy = (times) => {
    // Prevent infinite loops if Redis isn't running locally yet
    const delay = Math.min(times * 50, 2000);
    if (times > 5) {
        console.warn('⚠️ Could not connect to Redis. Retrying will be capped.');
    }
    return delay;
};

// Gracefully handles raw REDIS_URL string vs configuration object
const redisClient = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { retryStrategy, maxRetriesPerRequest: 3 })
    : new Redis({ host: '127.0.0.1', port: 6379, retryStrategy, maxRetriesPerRequest: 3 });
redisClient.isAvailable = false;

redisClient.on('ready', () => {
    redisClient.isAvailable = true;
    console.log('✅ Redis Ready!');
    const { redisStatus } = require('../metrics');
    if (redisStatus) redisStatus.set(1);
});

redisClient.on('error', (err) => {
    redisClient.isAvailable = false;
    if (redisClient.status !== 'reconnecting') {
        console.error('❌ Redis Connection Error:', err.message);
    }
});

redisClient.on('end', () => {
    redisClient.isAvailable = false;
    console.warn('⚠️ Redis Disconnected');
    const { redisStatus } = require('../metrics');
    if (redisStatus) redisStatus.set(0);
});

module.exports = redisClient;
