const { createClient } = require("redis");

console.log("REDIS_URL =", process.env.REDIS_URL);

if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL is missing");
  process.exit(1);
}

const redisClient = createClient({
  url: process.env.REDIS_URL,
});



redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

(async () => {
  await redisClient.connect();
  console.log("Redis connected");
})();

module.exports = redisClient;
