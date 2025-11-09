/**
 * @file src/test/business.service.test.js
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Business = require('../entity/module/business.model');
const BusinessService = require('../services/business.service');

mongoose.model('category', new mongoose.Schema({ name: String }));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'jest' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Business.deleteMany({});
});

describe('BusinessService', () => {
  const sampleBusiness = {
    owner_id: 'user123',
    business_name: 'Test Coffee',
    business_address: '123 Main Street',
    business_location: { type: 'Point', coordinates: [105.85, 21.03] },
    business_phone: '0123456789',
    business_detail: 'Nice coffee shop',
    business_status: true,
    business_active: 'active',
    business_rating: 4.5
  };

  // ---------- CREATE ----------
  describe('createBusiness', () => {
    it('should create a new business successfully', async () => {
      const created = await BusinessService.createBusiness(sampleBusiness);
      expect(created._id).toBeDefined();
      expect(created.business_name).toBe('Test Coffee');
    });

    it('should handle missing category gracefully', async () => {
      const created = await BusinessService.createBusiness({ ...sampleBusiness, business_category_id: null });
      expect(created.business_category_id).toBeNull();
    });

    it('should throw error on invalid data', async () => {
      await expect(BusinessService.createBusiness({ business_name: null }))
        .rejects
        .toThrow(/Error creating business/);
    });
  });

  // ---------- GET ALL ----------
  describe('getAllBusinesses', () => {
    beforeEach(async () => {
      await Business.create(sampleBusiness);
      await Business.create({ ...sampleBusiness, business_name: 'Another' });
    });

    it('should return paginated businesses', async () => {
      const result = await BusinessService.getAllBusinesses(1, 10);
      expect(result.businesses.length).toBeGreaterThan(0);
      expect(result.totalItems).toBe(2);
    });

    it('should sort by newest first', async () => {
      const result = await BusinessService.getAllBusinesses(1, 10, 'Newest');
      expect(result.businesses[0].business_name).toBeDefined();
    });

    it('should handle empty list', async () => {
      await Business.deleteMany({});
      const result = await BusinessService.getAllBusinesses();
      expect(result.totalItems).toBe(0);
    });
  });

  // ---------- GET BY ID ----------
  describe('getBusinessById', () => {
    it('should return a business by id', async () => {
      const created = await Business.create(sampleBusiness);
      const found = await BusinessService.getBusinessById(created._id);
      expect(found.business_name).toBe('Test Coffee');
    });

    it('should throw error if not found', async () => {
      await expect(BusinessService.getBusinessById(new mongoose.Types.ObjectId()))
        .rejects
        .toThrow(/Business not found/);
    });

    it('should handle invalid id format', async () => {
      await expect(BusinessService.getBusinessById('123'))
        .rejects
        .toThrow(/Error fetching business/);
    });
  });

  // ---------- UPDATE ----------
  describe('updateBusiness', () => {
    it('should update an existing business', async () => {
      const created = await Business.create(sampleBusiness);
      const updated = await BusinessService.updateBusiness(created._id, { business_name: 'Updated Shop' });
      expect(updated.business_name).toBe('Updated Shop');
    });

    it('should throw error if business not found', async () => {
      await expect(BusinessService.updateBusiness(new mongoose.Types.ObjectId(), { business_name: 'X' }))
        .rejects
        .toThrow(/Business not found/);
    });

    it('should throw validation error', async () => {
      const created = await Business.create(sampleBusiness);
      await expect(BusinessService.updateBusiness(created._id, { business_location: { type: 'Point', coordinates: [] } }))
        .rejects
        .toThrow(/Error updating business/);
    });
  });

  // ---------- DELETE ----------
  describe('deleteBusiness', () => {
    it('should delete business successfully', async () => {
      const created = await Business.create(sampleBusiness);
      const result = await BusinessService.deleteBusiness(created._id);
      expect(result.message).toMatch(/deleted successfully/);
    });

    it('should throw error if not found', async () => {
      await expect(BusinessService.deleteBusiness(new mongoose.Types.ObjectId()))
        .rejects
        .toThrow(/Business not found/);
    });

    it('should throw on invalid id', async () => {
      await expect(BusinessService.deleteBusiness('123'))
        .rejects
        .toThrow(/Error deleting business/);
    });
  });

  // ---------- SEARCH ----------
  describe('searchBusinesses', () => {
    beforeEach(async () => {
      await Business.create(sampleBusiness);
      await Business.create({ ...sampleBusiness, business_name: 'Another Cafe' });
    });

    it('should find businesses by keyword', async () => {
      const result = await BusinessService.searchBusinesses('Cafe');
      expect(result.businesses.length).toBe(1);
    });

    it('should return empty array for unmatched query', async () => {
      const result = await BusinessService.searchBusinesses('NoName');
      expect(result.businesses.length).toBe(0);
    });

    it('should paginate correctly', async () => {
      const result = await BusinessService.searchBusinesses('Test', 1, 1);
      expect(result.totalPages).toBeGreaterThan(0);
    });
  });

  // ---------- PRIORITY ----------
  describe('increaseBusinessPriority & resetBusinessPriority', () => {
    it('should increase priority', async () => {
      const created = await Business.create(sampleBusiness);
      const updated = await BusinessService.increaseBusinessPriority(created._id);
      expect(updated.business_priority).toBe(1);
    });

    it('should reset priority', async () => {
      const created = await Business.create({ ...sampleBusiness, business_priority: 0 });
      const updated = await BusinessService.resetBusinessPriority(created._id);
      expect(updated.business_priority).toBe(0);
    });

    it('should throw if business not found', async () => {
      await expect(BusinessService.increaseBusinessPriority(new mongoose.Types.ObjectId()))
        .rejects
        .toThrow(/Business not found/);
    });
  });

  // ---------- NEAREST ----------
  describe('findNearestBusinesses', () => {
    beforeEach(async () => {
      await Business.create(sampleBusiness);
      await Business.create({
        ...sampleBusiness,
        business_name: 'Far away',
        business_location: { type: 'Point', coordinates: [106, 21] }
      });
    });

    it('should find nearby businesses', async () => {
      const result = await BusinessService.findNearestBusinesses(21.03, 105.85, 5000);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle no results gracefully', async () => {
      const result = await BusinessService.findNearestBusinesses(0, 0, 100);
      expect(result.length).toBe(0);
    });

    it('should throw error if location invalid', async () => {
      await expect(BusinessService.findNearestBusinesses(null, null, 100))
        .rejects
        .toThrow(/Error finding nearest businesses/);
    });
  });
    describe('getBussinessByOwner', () => {
    it('should return businesses for a specific owner', async () => {
      const business = await Business.create({
        owner_id: 'owner123',
        business_name: 'Test Business',
        business_location: { type: 'Point', coordinates: [0, 0] },
        business_status: true
      });
      const result = await BusinessService.getBussinessByOwner('owner123');
      expect(result.length).toBe(1);
      expect(result[0].owner_id).toBe('owner123');
    });

    it('should return empty array if owner has no businesses', async () => {
      const result = await BusinessService.getBussinessByOwner('owner999');
      expect(result.length).toBe(0);
    });

    it('should handle invalid ownerId gracefully', async () => {
      await expect(BusinessService.getBussinessByOwner(null)).resolves.toEqual([]);
    });
  });

  // ======================================
  // getAllBusinessesWithRating
  // ======================================
  describe('getAllBusinessesWithRating', () => {
    it('should return businesses sorted by rating descending', async () => {
      await Business.create([
        { owner_id: '1', business_name: 'A', business_rating: 3, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true },
        { owner_id: '2', business_name: 'B', business_rating: 5, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true },
        { owner_id: '3', business_name: 'C', business_rating: 4, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true }
      ]);
      const { businesses } = await BusinessService.getAllBusinessesWithRating(1, 10);
      expect(businesses[0].business_rating).toBe(5);
      expect(businesses[1].business_rating).toBe(4);
      expect(businesses[2].business_rating).toBe(3);
    });

    it('should return empty array if no businesses exist', async () => {
      const { businesses } = await BusinessService.getAllBusinessesWithRating(1, 10);
      expect(businesses.length).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      for (let i = 0; i < 15; i++) {
        await Business.create({ owner_id: `${i}`, business_name: `Business ${i}`, business_rating: i % 5, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true });
      }
      const { businesses, totalPages } = await BusinessService.getAllBusinessesWithRating(2, 10);
      expect(businesses.length).toBe(5);
      expect(totalPages).toBe(2);
    });
  });

  // ======================================
  // getBusinessByCategory
  // ======================================
  describe('getBusinessByCategory', () => {
    it('should return businesses for a specific category', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      await Business.create([
        { owner_id: '1', business_name: 'A', business_category_id: categoryId, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true },
        { owner_id: '2', business_name: 'B', business_category_id: categoryId, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true }
      ]);
      const { businesses, totalItems } = await BusinessService.getBusinessByCategory(categoryId, 1, 10);
      expect(businesses.length).toBe(2);
      expect(totalItems).toBe(2);
    });

    it('should return empty array if no businesses match category', async () => {
      const { businesses, totalItems } = await BusinessService.getBusinessByCategory(new mongoose.Types.ObjectId(), 1, 10);
      expect(businesses.length).toBe(0);
      expect(totalItems).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      for (let i = 0; i < 12; i++) {
        await Business.create({ owner_id: `${i}`, business_name: `Biz ${i}`, business_category_id: categoryId, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true });
      }
      const { businesses, totalPages } = await BusinessService.getBusinessByCategory(categoryId, 2, 5);
      expect(businesses.length).toBe(5);
      expect(totalPages).toBe(3);
    });
  });

  // ======================================
  // increaseBusinessPriority
  // ======================================
  describe('increaseBusinessPriority', () => {
    it('should increase priority by 1', async () => {
      const business = await Business.create({ owner_id: '1', business_name: 'Test', business_priority: 0, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true });
      const updated = await BusinessService.increaseBusinessPriority(business._id);
      expect(updated.business_priority).toBe(1);
    });

    it('should throw error if business not found', async () => {
      await expect(BusinessService.increaseBusinessPriority(new mongoose.Types.ObjectId())).rejects.toThrow('Business not found');
    });

    it('should update updated_at field', async () => {
      const business = await Business.create({ owner_id: '1', business_name: 'Test', business_priority: 2, business_location: { type: 'Point', coordinates: [0,0] }, business_status: true });
      const updated = await BusinessService.increaseBusinessPriority(business._id);
      expect(updated.updated_at.getTime()).toBeGreaterThan(business.updated_at.getTime());
    });
  });

  // ======================================
  // resetBusinessPriority
  // ======================================
  describe('resetBusinessPriority', () => {
  it('should reset priority to 0', async () => {
    const business = await Business.create({
      owner_id: '1',
      business_name: 'Test',
      business_priority: 5,
      business_location: { type: 'Point', coordinates: [0,0] },
      business_status: true
    });

    // Thêm delay 1ms để updated_at khác
    await new Promise(res => setTimeout(res, 1));

    const updated = await BusinessService.resetBusinessPriority(business._id);
    expect(updated.business_priority).toBe(0);
  });

  it('should throw error if business not found', async () => {
    await expect(
      BusinessService.resetBusinessPriority(new mongoose.Types.ObjectId())
    ).rejects.toThrow('Business not found');
  });

  it('should update updated_at field', async () => {
    const business = await Business.create({
      owner_id: '1',
      business_name: 'Test',
      business_priority: 3,
      business_location: { type: 'Point', coordinates: [0,0] },
      business_status: true
    });

    // Delay 1ms trước khi update để tránh timestamp trùng
    await new Promise(res => setTimeout(res, 1));

    const updated = await BusinessService.resetBusinessPriority(business._id);
    expect(updated.updated_at.getTime()).toBeGreaterThan(business.updated_at.getTime());
  });
});

});
