const request = require('supertest');
const express = require('express');
const vocabularyRoutes = require('../../routes/vocabulary');
const VocabularyModel = require('../../database/models/vocabulary-model');

jest.mock('../../database/models/vocabulary-model');

describe('Vocabulary Routes', () => {
  let app;
  let mockVocabularyModel;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/vocabulary', vocabularyRoutes);

    mockVocabularyModel = {
      init: jest.fn().mockResolvedValue(),
      createList: jest.fn(),
      getAllLists: jest.fn(),
      getListByName: jest.fn(),
      updateList: jest.fn(),
      deleteList: jest.fn()
    };

    VocabularyModel.mockImplementation(() => mockVocabularyModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/vocabulary/save', () => {
    it('should save vocabulary list successfully', async () => {
      const mockList = { _id: '123', name: 'test-list' };
      mockVocabularyModel.createList.mockResolvedValue(mockList);

      const response = await request(app)
        .post('/api/vocabulary/save')
        .send({
          name: 'test-list',
          vocabulary: [{ DE: 'Hallo', VN: 'Xin chào' }]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('erfolgreich gespeichert');
    });

    it('should handle missing name', async () => {
      const response = await request(app)
        .post('/api/vocabulary/save')
        .send({
          vocabulary: [{ DE: 'Hallo', VN: 'Xin chào' }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Name ist erforderlich');
    });

    it('should handle empty vocabulary', async () => {
      const response = await request(app)
        .post('/api/vocabulary/save')
        .send({
          name: 'test-list',
          vocabulary: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Vokabelliste darf nicht leer sein');
    });

    it('should handle database errors', async () => {
      mockVocabularyModel.createList.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/vocabulary/save')
        .send({
          name: 'test-list',
          vocabulary: [{ DE: 'Hallo', VN: 'Xin chào' }]
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Database error');
    });
  });

  describe('GET /api/vocabulary/lists', () => {
    it('should return all vocabulary lists', async () => {
      const mockLists = [
        { name: 'list1', vocabulary: [] },
        { name: 'list2', vocabulary: [] }
      ];
      mockVocabularyModel.getAllLists.mockResolvedValue(mockLists);

      const response = await request(app)
        .get('/api/vocabulary/lists')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.lists).toHaveLength(2);
    });
  });

  describe('GET /api/vocabulary/list/:name', () => {
    it('should return specific vocabulary list', async () => {
      const mockList = {
        name: 'test-list',
        vocabulary: [{ DE: 'Hallo', VN: 'Xin chào' }]
      };
      mockVocabularyModel.getListByName.mockResolvedValue(mockList);

      const response = await request(app)
        .get('/api/vocabulary/list/test-list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe('test-list');
    });

    it('should handle non-existent list', async () => {
      mockVocabularyModel.getListByName.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/vocabulary/list/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('nicht gefunden');
    });
  });

  describe('DELETE /api/vocabulary/list/:name', () => {
    it('should delete vocabulary list', async () => {
      mockVocabularyModel.deleteList.mockResolvedValue(1);

      const response = await request(app)
        .delete('/api/vocabulary/list/test-list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('erfolgreich gelöscht');
    });

    it('should handle non-existent list deletion', async () => {
      mockVocabularyModel.deleteList.mockResolvedValue(0);

      const response = await request(app)
        .delete('/api/vocabulary/list/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('nicht gefunden');
    });
  });
});
