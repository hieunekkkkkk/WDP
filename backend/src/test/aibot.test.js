// __tests__/aibot.service.test.js
require('dotenv').config({ path: '.env.dev' });

const AiBot = require('../entity/module/aibot.model');
const BotKnowledgeService = require('../services/botknowledge.service');
const AiBotService = require('../services/aibot.service');

// Mock DB Models
jest.mock('../entity/module/aibot.model');
jest.mock('../services/botknowledge.service');

// Mock LangChain QdrantVectorStore
jest.mock('@langchain/qdrant', () => {
  const mockVectorStore = {
    similaritySearch: jest.fn().mockResolvedValue([{ pageContent: 'Hello', metadata: {} }]),
    asRetriever: jest.fn().mockReturnThis(),
    getRelevantDocuments: jest.fn().mockResolvedValue([{ pageContent: 'Doc1', metadata: {} }]),
  };

  return {
    QdrantVectorStore: {
      fromDocuments: jest.fn().mockResolvedValue(mockVectorStore),
      fromExistingCollection: jest.fn().mockResolvedValue(mockVectorStore),
    },
  };
});

// Mock Chat Model
const mockChatModel = {
  invoke: jest.fn().mockResolvedValue({ content: 'Hello response' }),
};

// Override embeddings and chatModel in AiBotService
AiBotService.embeddings = {};
AiBotService.chatModel = mockChatModel;

// Mock Qdrant client
AiBotService.qdrantClient = {
  getCollections: jest.fn().mockResolvedValue({ collections: [] }),
  createCollection: jest.fn().mockResolvedValue({}),
  deleteCollection: jest.fn().mockResolvedValue({}),
};

// Suppress console logs
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('AiBotService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === createBot ===
  describe('createBot', () => {
    it('should create bot and Qdrant collection', async () => {
      const savedBot = { _id: '1', name: 'Bot', owner_id: 'user1' };
      AiBot.prototype.save = jest.fn().mockResolvedValue(savedBot);

      const spyCreateQdrant = jest.spyOn(AiBotService, '_createQdrantCollection').mockResolvedValue();

      const result = await AiBotService.createBot({ name: 'Bot', owner_id: 'user1' });

      expect(AiBot.prototype.save).toHaveBeenCalled();
      expect(spyCreateQdrant).toHaveBeenCalledWith('1');
      expect(result).toEqual(savedBot);

      spyCreateQdrant.mockRestore();
    });

    it('should throw error if save fails', async () => {
      AiBot.prototype.save = jest.fn().mockRejectedValue(new Error('DB Error'));
      await expect(AiBotService.createBot({})).rejects.toThrow('DB Error');
    });
  });

  // === getBotsByOwner ===
  describe('getBotsByOwner', () => {
    it('returns bots for owner', async () => {
      AiBot.find.mockResolvedValue([{ _id: '1' }, { _id: '2' }]);
      const res = await AiBotService.getBotsByOwner('user1');
      expect(res).toHaveLength(2);
    });

    it('returns empty array if no bots', async () => {
      AiBot.find.mockResolvedValue([]);
      const res = await AiBotService.getBotsByOwner('userX');
      expect(res).toEqual([]);
    });

    it('throws on DB error', async () => {
      AiBot.find.mockRejectedValue(new Error('DB Error'));
      await expect(AiBotService.getBotsByOwner('user1')).rejects.toThrow('DB Error');
    });
  });

  // === getBotById ===
  describe('getBotById', () => {
    it('returns bot with knowledge', async () => {
      AiBot.findById.mockResolvedValue({ _id: '1', name: 'Bot1', description: 'desc', status: 'active', owner_id: 'user1' });
      BotKnowledgeService.getKnowledgeByBotId.mockResolvedValue([{ title: 'K1', content: 'Hello', tags: [] }]);

      const res = await AiBotService.getBotById('1');
      expect(res.name).toBe('Bot1');
      expect(res.knowledge).toHaveLength(1);
    });

    it('returns empty knowledge if none', async () => {
      AiBot.findById.mockResolvedValue({ _id: '1', name: 'Bot1', description: '', status: '', owner_id: 'user1' });
      BotKnowledgeService.getKnowledgeByBotId.mockResolvedValue([]);
      const res = await AiBotService.getBotById('1');
      expect(res.knowledge).toEqual([]);
    });

    
  });

  // === updateBot ===
  describe('updateBot', () => {
    it('updates bot successfully', async () => {
      AiBot.findByIdAndUpdate.mockResolvedValue({ _id: '1', name: 'New' });
      const res = await AiBotService.updateBot('1', { name: 'New' });
      expect(res.name).toBe('New');
    });

        it('throws on DB error', async () => {
      AiBot.findByIdAndUpdate.mockRejectedValue(new Error('DB Error'));
      await expect(AiBotService.updateBot('1', {})).rejects.toThrow('DB Error');
    });
  });

  // === deleteBot ===
  describe('deleteBot', () => {
    it('deletes bot and Qdrant collection', async () => {
      AiBot.findByIdAndDelete.mockResolvedValue({ _id: '1' });
      const res = await AiBotService.deleteBot('1');
      expect(res._id).toBe('1');
      expect(AiBotService.qdrantClient.deleteCollection).toHaveBeenCalled();
    });

    it('returns null if bot not found', async () => {
      AiBot.findByIdAndDelete.mockResolvedValue(null);
      const res = await AiBotService.deleteBot('999');
      expect(res).toBeNull();
    });
  });

  // === searchKnowledge ===
  describe('searchKnowledge', () => {
    it('returns search results', async () => {
      const res = await AiBotService.searchKnowledge('bot1', 'query');
      expect(res).toHaveLength(1);
      expect(res[0].content).toBe('Hello');
    });

    it('throws if similaritySearch fails', async () => {
      const { QdrantVectorStore } = require('@langchain/qdrant');
      const vectorStore = await QdrantVectorStore.fromDocuments([]);
      vectorStore.similaritySearch.mockRejectedValueOnce(new Error('Search error'));

      await expect(AiBotService.searchKnowledge('bot1', 'query')).rejects.toThrow('Search error');
    });
  });

  // === testHandleMessage ===
  describe('testHandleMessage', () => {
   


    it('falls back to basic response if RAG fails', async () => {
      AiBot.findById.mockResolvedValue({ _id: '2', name: 'Bot2', description: '' });
      const { QdrantVectorStore } = require('@langchain/qdrant');
      const vectorStore = await QdrantVectorStore.fromDocuments([]);
      vectorStore.asRetriever.mockImplementationOnce(() => { throw new Error('RAG error'); });

      const res = await AiBotService.testHandleMessage('2', 'Hello');
      expect(res.warning).toBe('Responded without knowledge base context due to error');
      expect(res.relevantDocs).toEqual([]);
      expect(res.response).toBe('Hello response');
    });
  });
});
