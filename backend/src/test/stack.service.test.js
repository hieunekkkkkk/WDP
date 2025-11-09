// __tests__/stack.service.test.js
const StackService = require('../services/stack.service');
const Stack = require('../entity/module/stack.model');

jest.mock('../entity/module/stack.model');

describe('StackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllStacks', () => {
    it('should return stacks with pagination', async () => {
      const mockStacks = [
        { _id: '1', stack_name: 'Stack A' },
        { _id: '2', stack_name: 'Stack B' }
      ];

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockStacks);

      Stack.find.mockReturnValue({ skip: mockSkip, limit: mockLimit });
      Stack.countDocuments.mockResolvedValue(2);

      const result = await StackService.getAllStacks(1, 2);

      expect(Stack.find).toHaveBeenCalled();
      expect(Stack.countDocuments).toHaveBeenCalled();
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(2);
      expect(result).toEqual({
        stacks: mockStacks,
        totalPages: 1,
        currentPage: 1,
        totalItems: 2
      });
    });

    it('should return empty array when page exceeds totalPages', async () => {
      Stack.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      Stack.countDocuments.mockResolvedValue(2);

      const result = await StackService.getAllStacks(10, 2);
      expect(result.stacks).toEqual([]);
      expect(result.totalPages).toBe(1);
    });

    it('should throw error when query fails', async () => {
      Stack.find.mockImplementation(() => { throw new Error('DB error'); });
      await expect(StackService.getAllStacks()).rejects
        .toThrow('Error fetching stacks: DB error');
    });
  });

  describe('getStackById', () => {
    it('should return stack when found', async () => {
      const mockStack = { _id: '123', stack_name: 'Stack Test' };
      Stack.findById.mockResolvedValue(mockStack);

      const result = await StackService.getStackById('123');

      expect(Stack.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockStack);
    });

    it('should throw error when stack not found', async () => {
      Stack.findById.mockResolvedValue(null);
      await expect(StackService.getStackById('999'))
        .rejects.toThrow('Stack not found');
    });

    it('should throw error if DB fails', async () => {
      Stack.findById.mockRejectedValue(new Error('DB failed'));
      await expect(StackService.getStackById('999'))
        .rejects.toThrow('Error fetching stack: DB failed');
    });
  });
});