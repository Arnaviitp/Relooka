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
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    if (env.NODE_ENV !== 'test') {
      console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn.connection;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
}

async function disconnectDB() {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
