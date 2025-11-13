const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserService = require('../services/user.service');
const User = require('../entity/module/user.model');
const { getClerkClient } = require('../middleware/clerkClient');

// Mock Clerk client
jest.mock('../middleware/clerkClient');

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
    await User.deleteMany({});
    jest.clearAllMocks();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('UserService', () => {
    describe('getAllUsers', () => {
        it('should return paginated users', async () => {
            for (let i = 1; i <= 15; i++) {
                await User.create({
                    clerkId: `user${i}`,
                    email: `user${i}@test.com`,
                    fullName: `User ${i}`
                });
            }

            const result = await UserService.getAllUsers(1, 10);

            expect(result.users).toHaveLength(10);
            expect(result.totalPages).toBe(2);
            expect(result.currentPage).toBe(1);
            expect(result.totalItems).toBe(15);
        });

        it('should return second page correctly', async () => {
            for (let i = 1; i <= 15; i++) {
                await User.create({
                    clerkId: `user${i}`,
                    email: `user${i}@test.com`,
                    fullName: `User ${i}`
                });
            }

            const result = await UserService.getAllUsers(2, 10);

            expect(result.users).toHaveLength(5);
            expect(result.currentPage).toBe(2);
        });

        it('should return empty array if no users', async () => {
            const result = await UserService.getAllUsers(1, 10);

            expect(result.users).toEqual([]);
            expect(result.totalItems).toBe(0);
        });

        it('should handle errors', async () => {
            jest.spyOn(User, 'countDocuments').mockRejectedValue(new Error('DB Error'));

            await expect(UserService.getAllUsers()).rejects.toThrow('Error fetching users from MongoDB');

            User.countDocuments.mockRestore();
        });
    });

    describe('getUserById', () => {
        it('should return user by clerkId', async () => {
            await User.create({
                clerkId: 'clerk123',
                email: 'test@test.com',
                fullName: 'Test User'
            });

            const result = await UserService.getUserById('clerk123');

            expect(result).toBeDefined();
            expect(result.clerkId).toBe('clerk123');
            expect(result.email).toBe('test@test.com');
        });

        it('should return null if user not found', async () => {
            const result = await UserService.getUserById('nonexistent');
            expect(result).toBeNull();
        });

        it('should handle errors', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB Error'));

            await expect(UserService.getUserById('test')).rejects.toThrow('Error fetching user by ID from MongoDB');

            User.findOne.mockRestore();
        });
    });

    describe('lockUser', () => {
        it('should lock user successfully', async () => {
            const mockClerk = {
                users: {
                    getUser: jest.fn().mockResolvedValue({
                        id: 'clerk123',
                        publicMetadata: {}
                    }),
                    updateUser: jest.fn().mockResolvedValue({
                        id: 'clerk123',
                        publicMetadata: { locked: true }
                    })
                }
            };
            getClerkClient.mockResolvedValue(mockClerk);

            await User.create({
                clerkId: 'clerk123',
                email: 'test@test.com',
                locked: false
            });

            const result = await UserService.lockUser('clerk123');

            expect(result.success).toBe(true);
            expect(result.locked).toBe(true);
            expect(mockClerk.users.updateUser).toHaveBeenCalled();

            const user = await User.findOne({ clerkId: 'clerk123' });
            expect(user.locked).toBe(true);
        });

        it('should handle errors', async () => {
            const mockClerk = {
                users: {
                    getUser: jest.fn().mockRejectedValue(new Error('Clerk error'))
                }
            };
            getClerkClient.mockResolvedValue(mockClerk);

            await expect(UserService.lockUser('clerk123')).rejects.toThrow('Error locking user');
        });
    });

    describe('unlockUser', () => {
        it('should unlock user successfully', async () => {
            const mockClerk = {
                users: {
                    getUser: jest.fn().mockResolvedValue({
                        id: 'clerk123',
                        publicMetadata: { locked: true }
                    }),
                    updateUser: jest.fn().mockResolvedValue({
                        id: 'clerk123',
                        publicMetadata: { locked: false }
                    })
                }
            };
            getClerkClient.mockResolvedValue(mockClerk);

            await User.create({
                clerkId: 'clerk123',
                email: 'test@test.com',
                locked: true
            });

            const result = await UserService.unlockUser('clerk123');

            expect(result.success).toBe(true);
            expect(result.locked).toBe(false);
            expect(mockClerk.users.updateUser).toHaveBeenCalled();

            const user = await User.findOne({ clerkId: 'clerk123' });
            expect(user.locked).toBe(false);
        });

        it('should handle errors', async () => {
            const mockClerk = {
                users: {
                    getUser: jest.fn().mockRejectedValue(new Error('Clerk error'))
                }
            };
            getClerkClient.mockResolvedValue(mockClerk);

            await expect(UserService.unlockUser('clerk123')).rejects.toThrow('Error unlocking user');
        });
    });
});
