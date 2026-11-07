const { setupTestDB, closeTestDB } = require('../setup/db');
const mongoose = require('mongoose');

describe('Database Setup Test', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('MongoDB in-memory instance connects and executes query', async () => {
    expect(mongoose.connection.readyState).toBe(1);
    const testSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.model('Test', testSchema);
    const doc = await TestModel.create({ name: 'LoopWear DB Check' });
    expect(doc.name).toBe('LoopWear DB Check');
    const found = await TestModel.findById(doc._id);
    expect(found.name).toBe('LoopWear DB Check');
  });
});

