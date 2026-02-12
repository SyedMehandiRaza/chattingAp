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




















// const redis = require("redis");

// const redisClient = redis.createClient({
//   socket: {
//     reconnectStrategy: (retries) => {
//       console.log("Redis reconnect attempt:", retries);
//       return Math.min(retries * 100, 3000);
//     },
//   },
// });

// redisClient.on("connect", () => {
//   console.log("Redis connected");
// });

// redisClient.on("ready", () => {
//   console.log("Redis ready");
// });

// redisClient.on("error", (err) => {
//   console.error("Redis error:", err.message);
// });

// redisClient.on("end", () => {
//   console.log("Redis connection closed");
// });

// (async () => {
//   try {
//     await redisClient.connect();
//   } catch (err) {
//     console.error("Redis initial connect failed:", err.message);
//   }
// })();

// module.exports = redisClient;
