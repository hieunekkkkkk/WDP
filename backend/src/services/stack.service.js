const Stack = require('../entity/module/stack.model');

class StackService {


    // Get all stacks with pagination
    async getAllStacks(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const stacks = await Stack.find()
                .skip(skip)
                .limit(limit);
            const total = await Stack.countDocuments();
            return {
                stacks,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error fetching stacks: ${error.message}`);
        }
    }

    // Get stack by ID
    async getStackById(id) {
        try {
            const stack = await Stack.findById(id);
            if (!stack) {
                throw new Error('Stack not found');
            }
            return stack;
        } catch (error) {
            throw new Error(`Error fetching stack: ${error.message}`);
        }
    }

}


module.exports = new StackService();