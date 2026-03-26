const { Queue } = require("bullmq");

// BullMQ needs a plain connection config, not the ioredis instance
const connection = {
    host: "127.0.0.1",
    port: 6379
};

const submissionQueue = new Queue("submission-queue", { connection });

module.exports = { submissionQueue, connection };
