const Redis = require("ioredis");

const options = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  db: Number(process.env.REDIS_DB ?? 0),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

if (process.env.REDIS_PASS) {
  options.password = process.env.REDIS_PASS;
}

module.exports = new Redis(options);
