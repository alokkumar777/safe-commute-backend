// server/src/queues/notificationQueue.js
const Queue = require("bull");
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const notifQueue = new Queue("notifications", redisUrl, {
  defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
});

module.exports = notifQueue;
