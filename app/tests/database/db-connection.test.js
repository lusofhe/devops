const dbConnection = require('../../database/db-connection');
const { MongoClient } = require('mongodb');

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: jest.fn()
}));

// Mock database config
jest.mock('../../config/database', () => ({
  mongodb: {
    getConnectionUrl: jest.fn(() => 'mongodb://localhost:27017/test'),
    dbName: 'test'
  }
}));

describe('Database Connection', () => {
  let mockClient;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      collection: jest.fn()
    };

    mockClient = {
      connect: jest.fn().mockResolvedValue(),
      db: jest.fn().mockReturnValue(mockDb),
      close: jest.fn().mockResolvedValue()
    };

    MongoClient.mockImplementation(() => mockClient);

    // Reset connection state
    dbConnection.client = null;
    dbConnection.db = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should establish database connection successfully', async () => {
      const db = await dbConnection.connect();

      expect(MongoClient).toHaveBeenCalled();
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.db).toHaveBeenCalled();
      expect(db).toBe(mockDb);
    });

    it('should return existing connection if already connected', async () => {
      // First connection
      await dbConnection.connect();

      // Second connection should reuse existing
      const db = await dbConnection.connect();

      expect(MongoClient).toHaveBeenCalledTimes(1);
      expect(db).toBe(mockDb);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockClient.connect.mockRejectedValue(error);

      await expect(dbConnection.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('getDb', () => {
    it('should return database instance when connected', async () => {
      await dbConnection.connect();
      const db = dbConnection.getDb();

      expect(db).toBe(mockDb);
    });

    it('should throw error when not connected', () => {
      expect(() => dbConnection.getDb()).toThrow('Database not connected');
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await dbConnection.connect();
      await dbConnection.close();

      expect(mockClient.close).toHaveBeenCalled();
      expect(dbConnection.client).toBeNull();
      expect(dbConnection.db).toBeNull();
    });

    it('should handle close when not connected', async () => {
      await dbConnection.close();
      // Should not throw error
    });
  });
});
