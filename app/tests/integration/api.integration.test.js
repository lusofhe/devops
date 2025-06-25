const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dbConnection = require('../../database/db-connection');

// Mock the config to use test database
jest.mock('../../config/database', () => ({
  mongodb: {
    getConnectionUrl: () => global.__MONGO_URI__,
    dbName: 'vocabulary_test',
    collections: {
      lists: 'lists',
      users: 'users',
      logs: 'logs'
    }
  }
}));

describe('API Integration Tests', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    global.__MONGO_URI__ = mongoServer.getUri();

    // Import app after setting up mock
    app = require('../../app');
  });

  afterAll(async () => {
    // Close database connection
    await dbConnection.close();

    // Stop in-memory MongoDB
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    const db = dbConnection.getDb();
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  });

  describe('Vocabulary API Integration', () => {
    it('should create, retrieve, and delete vocabulary list', async () => {
      const vocabularyData = {
        name: 'integration-test',
        vocabulary: [
          { DE: 'Hallo', VN: 'Xin chào' },
          { DE: 'Tschüss', VN: 'Tạm biệt' }
        ]
      };

      // Create vocabulary list
      const createResponse = await request(app)
        .post('/api/vocabulary/save')
        .send(vocabularyData)
        .expect(200);

      expect(createResponse.body.success).toBe(true);

      // Retrieve vocabulary list
      const getResponse = await request(app)
        .get('/api/vocabulary/list/integration-test')
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.name).toBe('integration-test');
      expect(getResponse.body.vocabulary).toHaveLength(2);

      // List all vocabularies
      const listResponse = await request(app)
        .get('/api/vocabulary/lists')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.lists).toHaveLength(1);

      // Delete vocabulary list
      const deleteResponse = await request(app)
        .delete('/api/vocabulary/list/integration-test')
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      await request(app)
        .get('/api/vocabulary/list/integration-test')
        .expect(404);
    });
  });

  describe('TTS API Integration', () => {
    beforeEach(async () => {
      // Create test vocabulary for TTS tests
      const vocabularyData = {
        name: 'tts-test',
        vocabulary: [{ DE: 'Test', VN: 'Thử nghiệm' }]
      };

      await request(app)
        .post('/api/vocabulary/save')
        .send(vocabularyData);
    });

    it('should list available vocabulary lists', async () => {
      const response = await request(app)
        .get('/api/tts/lists')
        .expect(200);

      expect(response.body.lists).toHaveLength(1);
      expect(response.body.lists[0].filename).toBe('tts-test');
    });

    it('should get specific vocabulary list', async () => {
      const response = await request(app)
        .get('/api/tts/list/tts-test')
        .expect(200);

      expect(response.body.name).toBe('tts-test');
      expect(response.body.vocabulary).toHaveLength(1);
    });
  });
});
