const request = require('supertest');

// Mock database connection
jest.mock('../database/db-connection', () => ({
  connect: jest.fn().mockResolvedValue({}),
  getDb: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: '123' }),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 })
    })
  }),
  close: jest.fn().mockResolvedValue({})
}));

// Mock init database script
jest.mock('../scripts/init-database', () => ({
  checkDatabaseStatus: jest.fn().mockResolvedValue(0),
  initDatabase: jest.fn().mockResolvedValue({})
}));

// Mock TTS Service
jest.mock('../services/tts-service', () => {
  return jest.fn().mockImplementation(() => ({
    setLanguage: jest.fn().mockReturnThis(),
    setSpeed: jest.fn().mockReturnThis(),
    setVoice: jest.fn().mockReturnThis(),
    generateSpeech: jest.fn().mockResolvedValue('/path/to/audio.mp3')
  }));
});

describe('Sprachenlern App API', () => {
  let app;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.GOOGLE_TTS_API_KEY = 'test-key';
    process.env.MONGODB_URL = 'mongodb://localhost:27017/test';

    // Import app after mocking
    app = require('../app');

    // Wait for app to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Clean up
    delete process.env.GOOGLE_TTS_API_KEY;
    delete process.env.MONGODB_URL;
  });

  describe('Basic Health Checks', () => {
    it('should serve main page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Deutsch-Vietnamesischer Vokabeltrainer');
    });

    it('should serve vocabulary lists page', async () => {
      const response = await request(app)
        .get('/vocabulary-lists')
        .expect(200);

      expect(response.text).toContain('Vokabellisten');
    });

    it('should serve vocabulary editor page', async () => {
      const response = await request(app)
        .get('/vocabulary-editor')
        .expect(200);

      expect(response.text).toContain('Vokabel-Editor');
    });

    it('should serve vocab trainer page', async () => {
      const response = await request(app)
        .get('/vocab-trainer')
        .expect(200);

      expect(response.text).toContain('Kartentrainer');
    });

    it('should serve text-to-speech page', async () => {
      const response = await request(app)
        .get('/text-to-speech')
        .expect(200);

      expect(response.text).toContain('Freitext zu Sprache');
    });
  });

  describe('API Endpoints', () => {
    it('should handle TTS lists API', async () => {
      const response = await request(app)
        .get('/api/tts/lists')
        .expect(200);

      expect(response.body).toHaveProperty('lists');
    });

    it('should handle vocabulary API', async () => {
      const response = await request(app)
        .get('/api/vocabulary/lists')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Static File Serving', () => {
    it('should serve CSS files', async () => {
      await request(app)
        .get('/css/styles.css')
        .expect(200);
    });

    it('should serve JavaScript files', async () => {
      await request(app)
        .get('/js/api-client.js')
        .expect(200);
    });
  });
});
