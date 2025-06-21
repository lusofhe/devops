// backend/tests/app.test.js
const request = require('supertest');

// Mock mongoose before importing the app
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  Schema: jest.fn().mockImplementation(() => ({})),
  model: jest.fn().mockImplementation((name) => {
    if (name === 'Message') {
      return MockMessage;
    }
    return {};
  }),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue({})
  }
}));

// Mock Message Model
const MockMessage = {
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439011',
        text: 'Mock message 1',
        timestamp: new Date('2023-01-01')
      },
      {
        _id: '507f1f77bcf86cd799439012',
        text: 'Mock message 2',
        timestamp: new Date('2023-01-02')
      }
    ])
  }),
  prototype: {
    save: jest.fn()
  }
};

// Constructor function for new messages
function MockMessageConstructor(data) {
  this.text = data.text;
  this.timestamp = data.timestamp || new Date();
  this._id = '507f1f77bcf86cd799439013';
  this.save = jest.fn().mockResolvedValue(this);
  return this;
}

// Assign static methods to constructor
Object.assign(MockMessageConstructor, MockMessage);

// Override the model function to return constructor
require('mongoose').model.mockImplementation((name) => {
  if (name === 'Message') {
    return MockMessageConstructor;
  }
  return {};
});

// Now import the app after mocking
const { app, server } = require('../src/app');

describe('Hello World Backend API', () => {

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
    jest.clearAllMocks();
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
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('text');
      expect(response.body[0]).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      const newMessage = { text: 'Test message from unit test' };

      const response = await request(app)
        .post('/api/messages')
        .send(newMessage)
        .expect(201);

      expect(response.body).toHaveProperty('text');
      expect(response.body.text).toBe('Test message from unit test');
      expect(response.body).toHaveProperty('_id');
    });

    it('should fail when text is missing', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when text is empty', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ text: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
