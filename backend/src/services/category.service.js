const Category = require('../entity/module/category.model');

class CategoryService {


    // Get all categories with pagination
    async getAllCategories(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const categories = await Category.find()
                .skip(skip)
                .limit(limit);
            const total = await Category.countDocuments();
            return {
                categories,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error fetching categories: ${error.message}`);
        }
    }

    // Get category by ID
    async getCategoryById(id) {
        try {
            const category = await Category.findById(id);
            if (!category) {
                throw new Error('Category not found');
            }
            return category;
        } catch (error) {
            throw new Error(`Error fetching category: ${error.message}`);
        }
    }


}

module.exports = new CategoryService();
