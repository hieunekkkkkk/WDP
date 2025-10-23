/**
 * @file src/test/botknowledge.service.test.js
 */

const mongoose = require('mongoose');
const botKnowledgeModel = require('../entity/module/botknowledge.model');
const botKnowledgeService = require('../services/botknowledge.service');
const fileToText = require('../utils/fileToText');

// Mock fileToText để không cần đọc file thật
jest.mock('../utils/fileToText', () => jest.fn().mockResolvedValue('mocked file text'));

beforeAll(async () => {
  // Kết nối MongoDB memory (nếu có setup in-memory) hoặc local test DB
  await mongoose.connect('mongodb://127.0.0.1:27017/test_botknowledge', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await botKnowledgeModel.deleteMany({});
});

describe('BotKnowledgeService', () => {

  test('createKnowledge: tạo kiến thức mới (không có file)', async () => {
    const fakeBotId = new mongoose.Types.ObjectId();

    const data = {
      created_by: 'admin',
      title: 'Test title',
      content: 'Test content',
      tags: ['tag1', 'tag2'],
    };

    const result = await botKnowledgeService.createKnowledge(fakeBotId, data);
    expect(result).toHaveProperty('_id');
    expect(result.title).toBe('Test title');
    expect(result.content).toBe('Test content');
  });

  test('createKnowledge: tạo kiến thức mới (có file)', async () => {
    const fakeBotId = new mongoose.Types.ObjectId();
    const data = {
      created_by: 'admin',
      title: 'File title',
      content: '',
      tags: ['fileTag'],
    };

    const result = await botKnowledgeService.createKnowledge(fakeBotId, data, 'fakePath.txt');
    expect(fileToText).toHaveBeenCalledWith('fakePath.txt');
    expect(result.content).toBe('mocked file text');
  });

  test('getKnowledges: trả về danh sách kiến thức', async () => {
    const fakeBotId1 = new mongoose.Types.ObjectId();
    const fakeBotId2 = new mongoose.Types.ObjectId();

    await botKnowledgeModel.create({ aibot_id: fakeBotId1, title: 'T1', content: 'C1' });
    await botKnowledgeModel.create({ aibot_id: fakeBotId2, title: 'T2', content: 'C2' });

    const knowledges = await botKnowledgeService.getKnowledges();
    expect(knowledges.length).toBe(2);
  });

  test('getKnowledgeByBotId: trả về kiến thức theo bot ID', async () => {
    const fakeBotA = new mongoose.Types.ObjectId();
    const fakeBotB = new mongoose.Types.ObjectId();

    await botKnowledgeModel.create({ aibot_id: fakeBotA, title: 'A1' });
    await botKnowledgeModel.create({ aibot_id: fakeBotB, title: 'B1' });

    const knowledges = await botKnowledgeService.getKnowledgeByBotId(fakeBotA);
    expect(knowledges.length).toBe(1);
    expect(knowledges[0].title).toBe('A1');
  });

  test('updateKnowledge: cập nhật kiến thức', async () => {
    const fakeBotId = new mongoose.Types.ObjectId();

    const knowledge = await botKnowledgeModel.create({
      aibot_id: fakeBotId,
      title: 'Old',
      content: 'Old content',
    });

    await botKnowledgeService.updateKnowledge(knowledge._id, {
      title: 'New Title',
      content: 'New Content',
      tags: ['updated'],
    });

    const updated = await botKnowledgeModel.findById(knowledge._id);
    expect(updated.title).toBe('New Title');
    expect(updated.content).toBe('New Content');
  });

  test('deleteKnowledge: xóa kiến thức', async () => {
    const fakeBotId = new mongoose.Types.ObjectId();

    const knowledge = await botKnowledgeModel.create({
      aibot_id: fakeBotId,
      title: 'Delete Me',
    });

    await botKnowledgeService.deleteKnowledge(knowledge._id);
    const result = await botKnowledgeModel.findById(knowledge._id);
    expect(result).toBeNull();
  });
});
