const BusinessView = require('../entity/module/business_view.model');
const BusinessViewService = require('../services/businessview.service');

jest.mock('../entity/module/business_view.model', () => {
  // Tạo một mock model hoạt động như function constructor và có static methods
  const mockModel = jest.fn(); // để new được
  mockModel.findOne = jest.fn();
  mockModel.aggregate = jest.fn();
  return mockModel;
});

describe('BusinessViewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------- TEST addView() --------------------
  describe('addView', () => {
    it('should create a new view if none exists for today', async () => {
      // Không có view nào -> findOne trả null
      BusinessView.findOne.mockResolvedValue(null);

      // Giả lập constructor instance có save()
      const mockSave = jest.fn().mockResolvedValue(true);
      BusinessView.mockImplementation(() => ({
        save: mockSave,
      }));

      await BusinessViewService.addView('biz123');

      expect(BusinessView.findOne).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should increment view_count if view exists', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockView = { view_count: 1, save: mockSave };

      BusinessView.findOne.mockResolvedValue(mockView);

      await BusinessViewService.addView('biz123');

      expect(mockView.view_count).toBe(2);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      console.error = jest.fn();
      BusinessView.findOne.mockRejectedValue(new Error('DB Error'));

      await BusinessViewService.addView('biz123');

      expect(console.error).toHaveBeenCalledWith(
        'Error adding business view:',
        expect.any(Error)
      );
    });
  });

  // -------------------- TEST getViewsInRange() --------------------
  describe('getViewsInRange', () => {
    it('should return formatted view data within date range', async () => {
      const mockData = [
        { _id: '2025-10-15', totalViews: 5 },
        { _id: '2025-10-16', totalViews: 10 },
      ];

      BusinessView.aggregate.mockResolvedValue(mockData);

      const result = await BusinessViewService.getViewsInRange(
        'biz123',
        '2025-10-01',
        '2025-10-31'
      );

      expect(BusinessView.aggregate).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { date: '2025-10-15', views: 5 },
        { date: '2025-10-16', views: 10 },
      ]);
    });

    it('should return [] and log error if aggregate fails', async () => {
      console.error = jest.fn();
      BusinessView.aggregate.mockRejectedValue(new Error('Aggregation failed'));

      const result = await BusinessViewService.getViewsInRange(
        'biz123',
        '2025-10-01',
        '2025-10-31'
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error getting views in range:',
        expect.any(Error)
      );
      expect(result).toEqual([]);
    });
  });
});
