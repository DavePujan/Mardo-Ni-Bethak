const rateLimit = require("express-rate-limit");
const redisClient = require("../config/redis");
// Handles CommonJS export variations across rate-limit-redis major versions
let RedisStoreObj = require("rate-limit-redis");
const RedisStore = RedisStoreObj.default || RedisStoreObj.RedisStore || RedisStoreObj;

// Built-in memory store from express-rate-limit for our fallback
const { MemoryStore } = require("express-rate-limit");

class HybridStore {
    constructor() {
        this.redisStore = null;
        this.memoryStore = new MemoryStore();
        this.redisDownUntil = 0;
        this.warned = false;
    }

    getRedisStore() {
        if (!redisClient.isAvailable) {
            this.redisStore = null; // 🔥 reset when Redis is down
            return null;
        }

        if (!this.redisStore) {
            this.redisStore = new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
            });
        }
        return this.redisStore;
    }

    async increment(key) {
        if (redisClient.isAvailable) {
            this.warned = false;
            // Try Redis first
            if (Date.now() >= this.redisDownUntil) {
                try {
                    const store = this.getRedisStore();
                    if (store) return await store.increment(key);
                } catch (e) {
                    console.warn("⚠️ Redis failed, triggering 5 sec circuit breaker. Falling back to memory:", e.message);
                    this.redisDownUntil = Date.now() + 5000;
                }
            }
        } else {
            if (!this.warned) {
                console.warn("⚠️ Using Memory Rate Limiter");
                this.warned = true;
            }
            const { fallbackCounter } = require("../metrics");
            if (fallbackCounter) fallbackCounter.inc();
        }

        // Fallback -> Memory
        return this.memoryStore.increment(key);
    }

    async decrement(key) {
        if (redisClient.isAvailable && Date.now() >= this.redisDownUntil) {
            const store = this.getRedisStore();
            if (store) {
                try { return await store.decrement(key); } catch (e) { }
            }
        }
        return this.memoryStore.decrement(key);
    }

    async resetKey(key) {
        if (redisClient.isAvailable && Date.now() >= this.redisDownUntil) {
            const store = this.getRedisStore();
            if (store) {
                try { return await store.resetKey(key); } catch (e) { }
            }
        }
        return this.memoryStore.resetKey(key);
    }
}

const createRedisStore = () => new HybridStore();

// Limits brute-force attacks on authentication
exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: "Too many login attempts. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || (req.headers && req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : req.socket.remoteAddress), // Safely handles proxy arrays and avoids req.ip ERL parser bug
    store: createRedisStore()
});

// Protects expensive AI endpoints (Gemini, Judge0)
exports.aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: { error: "Too many AI requests. Please preserve quota." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || (req.headers && req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : req.socket.remoteAddress), // Safely handles proxy arrays and avoids req.ip ERL parser bug
    store: createRedisStore()
});
