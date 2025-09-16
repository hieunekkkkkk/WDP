const ProductService = require('../services/product.service');

class ProductController {
  async createProduct(req, res) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllProducts(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await ProductService.getAllProducts(
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProductById(req, res) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getProductsByBusinessId(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await ProductService.getProductsByBusinessId(
        req.params.businessId,
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const result = await ProductService.deleteProduct(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();