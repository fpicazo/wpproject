require("dotenv").config();

const { Queue } = require("bullmq");
const RedisConnection = require("../../../redis/connection");

class WhatsappQueueProvider {
  queue = null;

  constructor() {
    this.queue = new Queue("@whatsapp:queue", {
      connection: RedisConnection,
      defaultJobOptions: {
        attempts: 5,
        removeOnComplete: true,
        backoff: { delay: 5000, type: "exponential" },
      },
    });
  }

  async startSession(job) {
    await this.queue.add("session", job);
  }

  async sendMessage(job) {
    await this.queue.add("message", job);
  }
}

module.exports = WhatsappQueueProvider;
