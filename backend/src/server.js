const app = require('./app');
const env = require('./core/config/env');
const { connectDB } = require('./core/db/mongoose');
const { seedDatabase } = require('./core/db/seed');

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Auto-seed demo data in development if database is empty
    if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
      try {
        await seedDatabase();
      } catch (seedErr) {
        console.warn('[Seeder Notice]', seedErr.message);
      }
    }

    const server = app.listen(PORT, env.HOST, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 LoopWear (Closet Circle) Monolith Server Running!`);
      console.log(`   Port:         ${PORT}`);
      console.log(`   Environment:  ${env.NODE_ENV}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`   API Docs:     http://localhost:${PORT}/api-docs`);
      console.log(`   Client URL:   ${env.CLIENT_URL}`);
      console.log(`======================================================\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;

