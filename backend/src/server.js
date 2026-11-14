const app = require('./app');
const env = require('./core/config/env');
const { connectDB, disconnectDB } = require('./core/db/mongoose');
const { seedDatabase } = require('./core/db/seed');

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB (with resilient fallback so cloud deploys never crash on health checks)
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn(`[MongoDB Warning] Could not connect to database: ${dbErr.message}. Starting in resilient mode.`);
    }

    // Auto-seed demo data if database is connected
    try {
      await seedDatabase();
    } catch (seedErr) {
      // Ignore seed errors if db offline
    }

    const server = app.listen(PORT, env.HOST, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 ${env.APP_NAME} Monolith Server Running!`);
      console.log(`   Port:         ${PORT}`);
      console.log(`   Environment:  ${env.NODE_ENV}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`   API Docs:     http://localhost:${PORT}/api-docs`);
      console.log(`   Client URL:   ${env.CLIENT_URL}`);
      console.log(`======================================================\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await disconnectDB();
          console.log('[MongoDB] Connection closed.');
        } catch (dbErr) {
          console.error('[MongoDB] Error during disconnect:', dbErr.message);
        }
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

