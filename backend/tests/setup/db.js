const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function setupTestDB() {
  const localTempDir = path.resolve(__dirname, '../../.mongo-temp');
  const runDbPath = path.join(localTempDir, `db-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(runDbPath, { recursive: true });

  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbPath: runDbPath,
      tmpDir: localTempDir
    }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  return uri;
}

async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

async function closeTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = {
  setupTestDB,
  clearTestDB,
  closeTestDB
};
