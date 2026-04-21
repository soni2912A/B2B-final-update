require('dotenv').config();

const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { startAllJobs } = require('./src/jobs/cronJobs');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();

    // Redis is optional — skip if REDIS_URL is not set
    if (process.env.REDIS_URL) {
      try {
        const { connectRedis } = require('./src/config/redis');
        await connectRedis();
      } catch (redisErr) {
        console.warn('⚠  Redis unavailable, continuing without it:', redisErr.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      startAllJobs();
    });
  } catch (error) {
    console.error('Startup Error:', error);
    process.exit(1);
  }
})();
