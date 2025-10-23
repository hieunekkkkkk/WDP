/**
 * @file src/test/business.service.test.js
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Business = require('../entity/module/business.model');
const businessService = require('../services/business.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Business.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('BusinessService', () => {
  test('createBusiness: tạo mới business', async () => {
    const data = {
      owner_id: 'user001',
      business_name: 'Cà phê 123',
      business_address: '123 Đường A',
      business_location: {
        type: 'Point',
        coordinates: [106.7, 10.7],
      },
      business_status: true,
    };

    const result = await businessService.createBusiness(data);

    expect(result).toHaveProperty('_id');
    expect(result.business_name).toBe('Cà phê 123');
    expect(result.business_address).toBe('123 Đường A');
  });

  test('getAllBusinesses: trả về danh sách business có phân trang', async () => {
    for (let i = 1; i <= 5; i++) {
      await Business.create({
        owner_id: `owner${i}`,
        business_name: `Shop ${i}`,
        business_address: `Địa chỉ ${i}`,
        business_location: {
          type: 'Point',
          coordinates: [106.6 + i, 10.7 + i],
        },
      });
    }

    const result = await businessService.getAllBusinesses(1, 3, 'Newest');
    expect(result.businesses.length).toBe(3);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  test('getBusinessById: trả về business theo ID', async () => {
    const created = await Business.create({
      owner_id: 'owner1',
      business_name: 'Tiệm trà sữa',
      business_address: 'Đường B',
      business_location: {
        type: 'Point',
        coordinates: [106.8, 10.8],
      },
    });

    const result = await businessService.getBusinessById(created._id);
    expect(result.business_name).toBe('Tiệm trà sữa');
  });

  test('updateBusiness: cập nhật thông tin business', async () => {
    const business = await Business.create({
      owner_id: 'owner2',
      business_name: 'Nhà hàng cũ',
      business_address: 'Đường C',
      business_location: {
        type: 'Point',
        coordinates: [106.5, 10.5],
      },
    });

    const updated = await businessService.updateBusiness(business._id, {
      business_name: 'Nhà hàng mới',
    });

    expect(updated.business_name).toBe('Nhà hàng mới');
  });

  test('deleteBusiness: xóa business theo ID', async () => {
    const business = await Business.create({
      owner_id: 'owner3',
      business_name: 'Tiệm ăn',
      business_address: 'Đường D',
      business_location: {
        type: 'Point',
        coordinates: [106.3, 10.3],
      },
    });

    const result = await businessService.deleteBusiness(business._id);
    expect(result.message).toBe('Business deleted successfully');

    const found = await Business.findById(business._id);
    expect(found).toBeNull();
  });

  test('getBussinessByOwner: trả về business theo owner', async () => {
    await Business.create({
      owner_id: 'ownerX',
      business_name: 'Quán A',
      business_location: {
        type: 'Point',
        coordinates: [106.4, 10.4],
      },
    });

    const result = await businessService.getBussinessByOwner('ownerX');
    expect(result.length).toBe(1);
    expect(result[0].business_name).toBe('Quán A');
  });

  test('increaseBusinessPriority: tăng độ ưu tiên', async () => {
    const business = await Business.create({
      business_name: 'Ưu tiên test',
      business_location: {
        type: 'Point',
        coordinates: [106.2, 10.2],
      },
      business_priority: 1,
    });

    const updated = await businessService.increaseBusinessPriority(business._id);
    expect(updated.business_priority).toBe(2);
  });

test('resetBusinessPriority: đặt lại độ ưu tiên = 0', async () => {
  const mockId = new mongoose.Types.ObjectId();
  const business = { _id: mockId, business_priority: 5, save: jest.fn() };

  jest.spyOn(Business, 'findById').mockResolvedValue(business);

  const updated = await businessService.resetBusinessPriority(mockId);

  expect(business.save).toHaveBeenCalled();
  expect(updated.business_priority).toBe(0);
});

  test('searchBusinesses: tìm business theo tên', async () => {
    await Business.create({
      business_name: 'Cửa hàng trà sữa',
      business_location: {
        type: 'Point',
        coordinates: [106.1, 10.1],
      },
    });

    const result = await businessService.searchBusinesses('trà');
    expect(result.businesses.length).toBe(1);
    expect(result.businesses[0].business_name).toMatch(/trà/);
  });
});
