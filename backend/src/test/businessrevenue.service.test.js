const mongoose = require('mongoose');
const xlsx = require('xlsx');
const BusinessRevenue = require('../entity/module/business_revenue.model');
const BusinessRevenueService = require('../services/businessRevenue.service');

jest.mock('../entity/module/business_revenue.model');
jest.mock('xlsx');
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
describe('BusinessRevenueService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createRevenue', () => {
    it('should create and save a new revenue record', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        revenue_name: 'Test Revenue',
        revenue_amount: 1000
      });

      BusinessRevenue.mockImplementation(() => ({
        save: mockSave,
        revenue_name: 'Test Revenue',
        revenue_amount: 1000
      }));
const result = await BusinessRevenueService.createRevenue('123456789', {
  revenue_name: 'Test Revenue',
  revenue_description: 'Test description',
  revenue_amount: 1000,
});

expect(result).toMatchObject({
  revenue_name: 'Test Revenue',
  revenue_amount: 1000,
});
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw an error if save fails', async () => {
      BusinessRevenue.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      }));

      await expect(BusinessRevenueService.createRevenue('1', {
        revenue_name: 'Error Test'
      })).rejects.toThrow('Save failed');
    });
  });

  describe('getRevenues', () => {
    it('should return revenues sorted by date descending', async () => {
      const mockData = [{ revenue_name: 'A' }, { revenue_name: 'B' }];
      BusinessRevenue.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockData)
      });

      const result = await BusinessRevenueService.getRevenues('biz123');
      expect(result).toEqual(mockData);
      expect(BusinessRevenue.find).toHaveBeenCalledWith({ business_id: 'biz123' });
    });
  });

  describe('getRevenuesInRange', () => {
    const validBizId = '507f191e810c19729de860ea';

    it('should aggregate revenues within date range', async () => {
      const mockData = [
        { _id: '2025-10-01', totalRevenue: 200 },
        { _id: '2025-10-02', totalRevenue: 300 }
      ];

      BusinessRevenue.aggregate.mockResolvedValue(mockData);

      const result = await BusinessRevenueService.getRevenuesInRange(
        validBizId,
        '2025-10-01',
        '2025-10-10'
      );

      expect(result).toEqual([
        { date: '2025-10-01', revenue: 200 },
        { date: '2025-10-02', revenue: 300 }
      ]);
      expect(BusinessRevenue.aggregate).toHaveBeenCalled();
    });

    it('should throw error if aggregation fails', async () => {
      BusinessRevenue.aggregate.mockRejectedValue(new Error('Aggregate failed'));
      await expect(
        BusinessRevenueService.getRevenuesInRange(validBizId, '2025-10-01', '2025-10-10')
      ).rejects.toThrow('Aggregate failed');
    });
  });

  describe('importRevenuesFromExcel', () => {
    it('should import data from Excel buffer', async () => {
      const mockBuffer = Buffer.from('fake_excel');
      const mockSheetData = [
        { revenue_name: 'Revenue 1', revenue_amount: 100 },
        { revenue_name: 'Revenue 2', revenue_amount: 200 },
      ];

      const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };
      xlsx.read.mockReturnValue(mockWorkbook);
      xlsx.utils = { sheet_to_json: jest.fn().mockReturnValue(mockSheetData) };
      BusinessRevenue.insertMany.mockResolvedValue(mockSheetData);

      const result = await BusinessRevenueService.importRevenuesFromExcel('biz123', mockBuffer);

      expect(xlsx.read).toHaveBeenCalledWith(mockBuffer, { type: 'buffer' });
      expect(BusinessRevenue.insertMany).toHaveBeenCalledWith(
        mockSheetData.map((r) => ({
          ...r,
          business_id: 'biz123',
          revenue_description: '',
          revenue_date: expect.any(Date)
        }))
      );
      expect(result).toBe(2);
    });

    it('should throw error if import fails', async () => {
      xlsx.read.mockImplementation(() => { throw new Error('Invalid file'); });
      await expect(
        BusinessRevenueService.importRevenuesFromExcel('biz123', Buffer.from('data'))
      ).rejects.toThrow('Invalid file');
    });
  });
});
