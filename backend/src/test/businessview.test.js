const mongoose = require('mongoose');
const BusinessViewService = require('../services/businessview.service');
const BusinessView = require('../entity/module/business_view.model');

describe('BusinessViewService', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/test_db_businessview', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await BusinessView.deleteMany({});
    jest.restoreAllMocks();
  });

  // ----------------------------------------------------------
  describe('addView', () => {
    it('should create a new view record if not exists', async () => {
      const businessId = new mongoose.Types.ObjectId();

      // gọi hàm
      await BusinessViewService.addView(businessId);

      // kiểm tra DB có ghi chưa
      const saved = await BusinessView.findOne({ business_id: businessId });
      expect(saved).toBeDefined();
      expect(saved.business_id.toString()).toBe(businessId.toString());
      expect(saved.view_count).toBe(1);
    });

    it('should increase view count if record already exists for the same day', async () => {
      const businessId = new mongoose.Types.ObjectId();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      await BusinessView.create({
        business_id: businessId,
        view_date: today.getTime(),
        view_count: 2,
      });

      await BusinessViewService.addView(businessId);

      const updated = await BusinessView.findOne({ business_id: businessId });
      expect(updated).toBeDefined();
      expect(updated.view_count).toBe(3);
    });

    it('should not throw but log an error if something goes wrong', async () => {
  jest.spyOn(BusinessView, 'findOne').mockRejectedValueOnce(new Error('DB error'));
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await BusinessViewService.addView('invalid-id');
  expect(consoleSpy).toHaveBeenCalled(); // sửa ở đây
  consoleSpy.mockRestore();
});
  });

  // ----------------------------------------------------------
  describe('getViewsInRange', () => {
    it('should return aggregated view counts in date range', async () => {
      const businessId = new mongoose.Types.ObjectId();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      await BusinessView.insertMany([
        { business_id: businessId, view_date: yesterday.getTime(), view_count: 2 },
        { business_id: businessId, view_date: today.getTime(), view_count: 3 },
      ]);

      const start = yesterday.toISOString();
      const end = today.toISOString();

      const result = await BusinessViewService.getViewsInRange(businessId, start, end);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('views');
      expect(result.find(r => r.views === 3)).toBeTruthy();
    });

    it('should return an empty array when no records found', async () => {
      const businessId = new mongoose.Types.ObjectId();
      const start = new Date(2020, 0, 1).toISOString();
      const end = new Date(2020, 0, 2).toISOString();

      const result = await BusinessViewService.getViewsInRange(businessId, start, end);
      expect(result).toEqual([]);
    });

    
it('should return [] when error occurs', async () => {
  jest.spyOn(BusinessView, 'aggregate').mockRejectedValueOnce(new Error('Aggregation failed'));
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // tắt log
  const businessId = new mongoose.Types.ObjectId();
  const result = await BusinessViewService.getViewsInRange(businessId, '2020-01-01', '2020-01-02');
  expect(result).toEqual([]);
  consoleSpy.mockRestore();
});
  });
});
