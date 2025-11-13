const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const BusinessView = require('../entity/module/business_view.model');
const BusinessViewService = require('../services/businessview.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(async () => {
  await BusinessView.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('BusinessViewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------- TEST addView() --------------------
  describe('addView', () => {
    it('should create a new view if none exists for today', async () => {
      const businessId = new mongoose.Types.ObjectId();

      await BusinessViewService.addView(businessId);

      const views = await BusinessView.find({ business_id: businessId });
      expect(views.length).toBe(1);
      expect(views[0].view_count).toBe(1);
    });

    it('should increment view_count if view exists', async () => {
      const businessId = new mongoose.Types.ObjectId();

      await BusinessViewService.addView(businessId);
      await BusinessViewService.addView(businessId);

      const views = await BusinessView.find({ business_id: businessId });
      expect(views.length).toBe(1);
      expect(views[0].view_count).toBe(2);
    });

    it('should handle errors gracefully', async () => {
      await BusinessViewService.addView(null);
      // Should not throw error, just log
      expect(console.error).toHaveBeenCalled();
    });
  });

  // -------------------- TEST getViewsInRange() --------------------
  describe('getViewsInRange', () => {
    it('should return formatted view data within date range', async () => {
      const businessId = new mongoose.Types.ObjectId();

      await BusinessView.create({
        business_id: businessId,
        view_date: new Date('2025-10-15').getTime(),
        view_count: 5
      });
      await BusinessView.create({
        business_id: businessId,
        view_date: new Date('2025-10-16').getTime(),
        view_count: 10
      });

      const result = await BusinessViewService.getViewsInRange(
        businessId,
        '2025-10-01',
        '2025-10-31'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('views');
    });

    it('should return [] and log error if aggregate fails', async () => {
      const result = await BusinessViewService.getViewsInRange(
        null,
        '2025-10-01',
        '2025-10-31'
      );

      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
