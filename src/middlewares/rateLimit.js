const rateLimit = require("express-rate-limit");
const { slowDown } = require("express-slow-down");
const { RedisStore } = require("rate-limit-redis");
const { client } = require("../config/redis");

function makeStore(prefix) {
    return new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
        prefix,
    });
}

function makeLimiter(windowMs, limit, prefix, message) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        passOnStoreError: true,
        store: makeStore(prefix),
        message: { success: false, message },
    });
}

const authLimiter = makeLimiter(15 * 60 * 1000, 10, "rl:auth:", "Trop de tentatives, réessayez plus tard");
const standardLimiter = makeLimiter(60 * 1000, 120, "rl:standard:", "Trop de requêtes, réessayez dans une minute");
const analyticsLimiter = makeLimiter(60 * 1000, 20, "rl:analytics:", "Quota analytics dépassé, réessayez dans une minute");

const analyticsSlowDown = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: (used) => (used - 50) * 150,
    maxDelayMs: 2000,
    store: makeStore("sd:analytics:"),
});

module.exports = { authLimiter, standardLimiter, analyticsLimiter, analyticsSlowDown };