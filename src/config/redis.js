const { createClient } = require("redis");

const client = createClient({ url: process.env.REDIS_URL });

client.on("error", (err) => console.warn("Redis error:", err.message));
client.on("ready", () => console.log("Redis connected"));

client.connect().catch(() => {});

module.exports = { client };