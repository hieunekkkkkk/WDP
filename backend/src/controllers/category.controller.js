const CategoryService = require('../services/category.service');

class CategoryController {


  async getAllCategories(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await CategoryService.getAllCategories(
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCategoryById(req, res) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      res.status(200).json(category);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

}

module.exports = new CategoryController();
