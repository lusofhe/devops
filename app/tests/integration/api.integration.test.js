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

    // Establish database connection BEFORE importing app
    await dbConnection.connect();

    // Import app after setting up mock and database connection
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
    try {
      // Make sure we have a connection before trying to use it
      const db = await dbConnection.connect(); // ✅ Ensure connection first
      const collections = await db.listCollections().toArray();

      for (const collection of collections) {
        await db.collection(collection.name).deleteMany({});
      }
    } catch (error) {
      console.error('Error clearing test database:', error);
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

    it('should handle duplicate list names', async () => {
      const vocabularyData = {
        name: 'duplicate-test',
        vocabulary: [{ DE: 'Test', VN: 'Thử nghiệm' }]
      };

      // Create first list
      await request(app)
          .post('/api/vocabulary/save')
          .send(vocabularyData)
          .expect(200);

      // Try to create duplicate
      const response = await request(app)
          .post('/api/vocabulary/save')
          .send(vocabularyData)
          .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('existiert bereits');
    });

    it('should handle invalid input data', async () => {
      // Test empty vocabulary
      const response1 = await request(app)
          .post('/api/vocabulary/save')
          .send({
            name: 'empty-test',
            vocabulary: []
          })
          .expect(400);

      expect(response1.body.success).toBe(false);
      expect(response1.body.error).toContain('Ungültige Daten');

      // Test missing name
      const response2 = await request(app)
          .post('/api/vocabulary/save')
          .send({
            vocabulary: [{ DE: 'Test', VN: 'Thử nghiệm' }]
          })
          .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.error).toContain('Ungültige Daten');
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

      expect(response.body).toHaveProperty('lists');
      // Note: This might need to be adjusted based on your actual TTS implementation
    });

    it('should get specific vocabulary list', async () => {
      // This test might need to be adjusted based on your actual TTS API implementation
      const response = await request(app)
          .get('/api/vocabulary/list/tts-test')
          .expect(200);

      expect(response.body.name).toBe('tts-test');
      expect(response.body.vocabulary).toHaveLength(1);
    });
  });
});