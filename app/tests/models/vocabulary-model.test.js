const VocabularyModel = require('../../database/models/vocabulary-model');
const dbConnection = require('../../database/db-connection');
const DatabaseHandler = require('../../database/handlers/db-handler');

jest.mock('../../database/db-connection');
jest.mock('../../database/handlers/db-handler');

describe('VocabularyModel', () => {
  let vocabularyModel;
  let mockDbHandler;

  beforeEach(() => {
    mockDbHandler = {
      init: jest.fn().mockResolvedValue(),
      findOne: jest.fn(),
      saveVocabularyList: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn()
    };

    DatabaseHandler.mockImplementation(() => mockDbHandler);
    dbConnection.connect.mockResolvedValue();

    vocabularyModel = new VocabularyModel();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createList', () => {
    it('should create new vocabulary list successfully', async () => {
      const mockList = { _id: '123', name: 'test-list' };
      mockDbHandler.findOne.mockResolvedValue(null);
      mockDbHandler.saveVocabularyList.mockResolvedValue(mockList);

      const result = await vocabularyModel.createList('test-list', []);

      expect(mockDbHandler.findOne).toHaveBeenCalledWith({ name: 'test-list' });
      expect(mockDbHandler.saveVocabularyList).toHaveBeenCalledWith('test-list', []);
      expect(result).toBe(mockList);
    });

    it('should throw error if list already exists', async () => {
      mockDbHandler.findOne.mockResolvedValue({ name: 'test-list' });

      await expect(vocabularyModel.createList('test-list', []))
        .rejects.toThrow('Eine Liste mit dem Namen \'test-list\' existiert bereits');
    });
  });

  describe('getAllLists', () => {
    it('should return all vocabulary lists', async () => {
      const mockLists = [{ name: 'list1' }, { name: 'list2' }];
      mockDbHandler.find.mockResolvedValue(mockLists);

      const result = await vocabularyModel.getAllLists();

      expect(mockDbHandler.find).toHaveBeenCalledWith({});
      expect(result).toBe(mockLists);
    });
  });

  describe('getListByName', () => {
    it('should return specific vocabulary list', async () => {
      const mockList = { name: 'test-list', vocabulary: [] };
      mockDbHandler.findOne.mockResolvedValue(mockList);

      const result = await vocabularyModel.getListByName('test-list');

      expect(mockDbHandler.findOne).toHaveBeenCalledWith({ name: 'test-list' });
      expect(result).toBe(mockList);
    });
  });

  describe('updateList', () => {
    it('should update vocabulary list', async () => {
      mockDbHandler.update.mockResolvedValue(1);

      const result = await vocabularyModel.updateList('test-list', []);

      expect(mockDbHandler.update).toHaveBeenCalledWith(
        { name: 'test-list' },
        { $set: { vocabulary: [], updatedAt: expect.any(Date) } }
      );
      expect(result).toBe(1);
    });
  });

  describe('deleteList', () => {
    it('should delete vocabulary list', async () => {
      mockDbHandler.remove.mockResolvedValue(1);

      const result = await vocabularyModel.deleteList('test-list');

      expect(mockDbHandler.remove).toHaveBeenCalledWith({ name: 'test-list' });
      expect(result).toBe(1);
    });
  });
});
