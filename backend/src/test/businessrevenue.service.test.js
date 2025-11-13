const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const xlsx = require('xlsx');
const BusinessRevenue = require('../entity/module/business_revenue.model');
const BusinessRevenueService = require('../services/businessRevenue.service');

jest.mock('xlsx');

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
  await BusinessRevenue.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('BusinessRevenueService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createRevenue', () => {
    it('should create and save a new revenue record', async () => {
      const businessId = new mongoose.Types.ObjectId();
      const result = await BusinessRevenueService.createRevenue(businessId, {
        revenue_name: 'Test Revenue',
        revenue_description: 'Test description',
        revenue_amount: 1000,
      });

      expect(result).toMatchObject({
        revenue_name: 'Test Revenue',
        revenue_amount: 1000,
      });
      expect(result._id).toBeDefined();
    });

    it('should throw an error if save fails', async () => {
      await expect(BusinessRevenueService.createRevenue(null, {
        revenue_name: 'Error Test'
      })).rejects.toThrow();
    });
  });

  describe('getRevenues', () => {
    it('should return revenues sorted by date descending', async () => {
      const businessId = new mongoose.Types.ObjectId();

      await BusinessRevenue.create({
        business_id: businessId,
        revenue_name: 'A',
        revenue_amount: 100
      });
      await BusinessRevenue.create({
        business_id: businessId,
        revenue_name: 'B',
        revenue_amount: 200
      });

      const result = await BusinessRevenueService.getRevenues(businessId);
      expect(result.length).toBe(2);
      expect(result[0].revenue_name).toBeDefined();
    });
  });

  describe('getRevenuesInRange', () => {
    it('should aggregate revenues within date range', async () => {
      const businessId = new mongoose.Types.ObjectId();

      await BusinessRevenue.create({
        business_id: businessId,
        revenue_name: 'Rev1',
        revenue_amount: 200,
        revenue_date: new Date('2025-10-01')
      });
      await BusinessRevenue.create({
        business_id: businessId,
        revenue_name: 'Rev2',
        revenue_amount: 300,
        revenue_date: new Date('2025-10-02')
      });

      const result = await BusinessRevenueService.getRevenuesInRange(
        businessId,
        '2025-10-01',
        '2025-10-10'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('revenue');
    });

    it('should throw error if aggregation fails', async () => {
      await expect(
        BusinessRevenueService.getRevenuesInRange(null, '2025-10-01', '2025-10-10')
      ).rejects.toThrow();
    });
  });

  describe('importRevenuesFromExcel', () => {
    it('should import data from Excel buffer', async () => {
      const businessId = new mongoose.Types.ObjectId();
      const mockBuffer = Buffer.from('fake_excel');
      const mockSheetData = [
        { revenue_name: 'Revenue 1', revenue_amount: 100 },
        { revenue_name: 'Revenue 2', revenue_amount: 200 },
      ];

      const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };
      xlsx.read.mockReturnValue(mockWorkbook);
      xlsx.utils = { sheet_to_json: jest.fn().mockReturnValue(mockSheetData) };

      const result = await BusinessRevenueService.importRevenuesFromExcel(businessId, mockBuffer);

      expect(xlsx.read).toHaveBeenCalledWith(mockBuffer, { type: 'buffer' });
      expect(result).toBe(2);

      // Verify data was inserted
      const revenues = await BusinessRevenue.find({ business_id: businessId });
      expect(revenues.length).toBe(2);
    });

    it('should throw error if import fails', async () => {
      xlsx.read.mockImplementation(() => { throw new Error('Invalid file'); });
      await expect(
        BusinessRevenueService.importRevenuesFromExcel('biz123', Buffer.from('data'))
      ).rejects.toThrow('Invalid file');
    });
  });
});
