const mongoose = require('mongoose');
const env = require('../config/env');

let isConnected = false;

async function connectDB(uri = null) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = uri || env.MONGO_URI;

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
      autoIndex: true
    });
    isConnected = true;
    if (env.NODE_ENV !== 'test') {
      console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn.connection;
  } catch (error) {
    if (env.NODE_ENV === 'development' && !uri) {
      console.warn(`[MongoDB] Could not connect to external MongoDB at ${mongoUri}.`);
      console.log(`[MongoDB] Initializing embedded in-memory MongoDB for zero-setup local development...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        if (!global.__DEV_MONGO_SERVER__) {
          const fs = require('fs');
          const path = require('path');
          const devTemp = path.resolve(__dirname, '../../../.mongo-temp');
          if (!fs.existsSync(devTemp)) fs.mkdirSync(devTemp, { recursive: true });
          global.__DEV_MONGO_SERVER__ = await MongoMemoryServer.create({
            instance: {
              dbPath: path.join(devTemp, 'dev-db'),
              tmpDir: devTemp
            }
          });
        }
        const memUri = global.__DEV_MONGO_SERVER__.getUri();
        const conn = await mongoose.connect(memUri, { autoIndex: true });
        isConnected = true;
        console.log(`[MongoDB] Embedded in-memory MongoDB ready at ${memUri}`);
        return conn.connection;
      } catch (memErr) {
        console.error(`[MongoDB] Failed to start in-memory Mongo: ${memErr.message}`);
      }
    }
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
}

async function disconnectDB() {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
  if (global.__DEV_MONGO_SERVER__) {
    await global.__DEV_MONGO_SERVER__.stop();
    global.__DEV_MONGO_SERVER__ = null;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
