const request = require('supertest');
const { app, server } = require('../src/app');

describe('Hello World Backend API', () => {

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('GET /', () => {
    it('should return hello world message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Hello World from Backend!');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/messages', () => {
    it('should return messages array', async () => {
      const response = await request(app)
        .get('/api/messages')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      const newMessage = { text: 'Test message' };

      const response = await request(app)
        .post('/api/messages')
        .send(newMessage)
        .expect(201);

      expect(response.body).toHaveProperty('text');
      expect(response.body.text).toBe('Test message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should fail when text is missing', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
