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
  jest.restoreAllMocks();
});

describe('BotKnowledgeService', () => {

  // ===============================
  // 🧠 CREATE KNOWLEDGE
  // ===============================
  describe('createKnowledge', () => {
    test('tạo kiến thức mới (không có file)', async () => {
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
      expect(result.aibot_id.toString()).toBe(fakeBotId.toString());
    });

    test('tạo kiến thức mới (có file)', async () => {
      const fakeBotId = new mongoose.Types.ObjectId();
      const data = { created_by: 'admin', title: 'File title', content: '', tags: ['fileTag'] };

      const result = await botKnowledgeService.createKnowledge(fakeBotId, data, 'fakePath.txt');
      expect(fileToText).toHaveBeenCalledWith('fakePath.txt');
      expect(result.content).toBe('mocked file text');
    });

    test('ném lỗi nếu thiếu bot ID', async () => {
      await expect(botKnowledgeService.createKnowledge(null, { title: 'No bot' }))
        .rejects.toThrow();
    });

    test('ném lỗi nếu MongoDB lỗi khi tạo', async () => {
      // mock save trên prototype để ném lỗi
      jest.spyOn(botKnowledgeModel.prototype, 'save').mockRejectedValueOnce(new Error('DB Error'));
      await expect(botKnowledgeService.createKnowledge(new mongoose.Types.ObjectId(), { title: 'T' }))
        .rejects.toThrow('DB Error');
    });
  });

  // ===============================
  // 📚 GET ALL KNOWLEDGES
  // ===============================
  describe('getKnowledges', () => {
    test('trả về danh sách kiến thức', async () => {
      await botKnowledgeModel.create([
        { aibot_id: new mongoose.Types.ObjectId(), title: 'T1', content: 'C1' },
        { aibot_id: new mongoose.Types.ObjectId(), title: 'T2', content: 'C2' },
      ]);

      const knowledges = await botKnowledgeService.getKnowledges();
      expect(knowledges.length).toBe(2);
      expect(knowledges[0]).toHaveProperty('title');
    });

    test('trả về mảng rỗng nếu không có dữ liệu', async () => {
      const knowledges = await botKnowledgeService.getKnowledges();
      expect(Array.isArray(knowledges)).toBe(true);
      expect(knowledges.length).toBe(0);
    });
  });

  // ===============================
  // 🔍 GET BY BOT ID
  // ===============================
  describe('getKnowledgeByBotId', () => {
    test('trả về kiến thức theo bot ID', async () => {
      const fakeBotA = new mongoose.Types.ObjectId();
      const fakeBotB = new mongoose.Types.ObjectId();

      await botKnowledgeModel.create({ aibot_id: fakeBotA, title: 'A1' });
      await botKnowledgeModel.create({ aibot_id: fakeBotB, title: 'B1' });

      const knowledges = await botKnowledgeService.getKnowledgeByBotId(fakeBotA);
      expect(knowledges.length).toBe(1);
      expect(knowledges[0].title).toBe('A1');
    });

    test('trả về mảng rỗng nếu không có kiến thức cho bot ID', async () => {
      const knowledges = await botKnowledgeService.getKnowledgeByBotId(new mongoose.Types.ObjectId());
      expect(knowledges).toEqual([]);
    });
  });

  // ===============================
  // ✏️ UPDATE
  // ===============================
  describe('updateKnowledge', () => {
  test('cập nhật kiến thức thành công', async () => {
    const fakeBotId = new mongoose.Types.ObjectId();
    const knowledge = await botKnowledgeModel.create({
      aibot_id: fakeBotId,
      title: 'Old',
      content: 'Old content',
    });

    // Gọi hàm update
    const updated = await botKnowledgeService.updateKnowledge(knowledge._id, {
      title: 'New Title',
      content: 'New Content',
      tags: ['updated'],
    });

    // Kiểm tra service trả về document (không null)
    expect(updated).not.toBeNull();

    // Truy vấn lại DB để xác minh giá trị đã được cập nhật
    const refreshed = await botKnowledgeModel.findById(knowledge._id);
    expect(refreshed.title).toBe('New Title');
    expect(refreshed.content).toBe('New Content');
    expect(refreshed.tags).toContain('updated');
  });

  test('trả null nếu knowledge không tồn tại (thay vì ném lỗi)', async () => {
    const invalidId = new mongoose.Types.ObjectId();
    const result = await botKnowledgeService.updateKnowledge(invalidId, { title: 'X' });

    // Phù hợp với hành vi service hiện tại (trả null khi không tìm thấy)
    expect(result).toBeNull();
  });
});

  // ===============================
  // ❌ DELETE
  // ===============================
  describe('deleteKnowledge', () => {
    test('xóa kiến thức thành công', async () => {
      const fakeBotId = new mongoose.Types.ObjectId();
      const knowledge = await botKnowledgeModel.create({ aibot_id: fakeBotId, title: 'Delete Me' });

      await botKnowledgeService.deleteKnowledge(knowledge._id);
      const result = await botKnowledgeModel.findById(knowledge._id);
      expect(result).toBeNull();
    });

    test('trả null khi xóa kiến thức không tồn tại (thay vì ném lỗi)', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const result = await botKnowledgeService.deleteKnowledge(invalidId);
      expect(result).toBeNull();
    });
  });
});
