const Product = require('../entity/module/product.model');
const mongoose = require('mongoose');

class ProductService {
    // Create a new product
    async createProduct(productData) {
        try {
            if (productData.business_id) {
                productData.business_id = new mongoose.Types.ObjectId(productData.business_id);
            }

            const product = new Product(productData);
            return await product.save();
        } catch (error) {
            throw new Error(`Error creating product: ${error.message}`);
        }
    }

    // Get all products with pagination
    async getAllProducts(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const products = await Product.find()
                .skip(skip)
                .limit(limit)
                .populate('business_id');
            const total = await Product.countDocuments();
            return {
                products,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error fetching products: ${error.message}`);
        }
    }

    // Get product by ID
    async getProductById(id) {
        try {
            const product = await Product.findById(id).populate('business_id');
            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            throw new Error(`Error fetching product: ${error.message}`);
        }
    }

    async getProductsByBusinessId(businessId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const products = await Product.find({ business_id: businessId })
                .skip(skip)
                .limit(limit)
                .populate('business_id');
            const total = await Product.countDocuments({ business_id: businessId });
            return {
                products,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error fetching products by business ID: ${error.message}`);
        }
    }

    // Update product
    async updateProduct(id, updateData) {
        try {
            if (updateData.business_id) {
                updateData.business_id = new mongoose.Types.ObjectId(updateData.business_id);
            }
            const product = await Product.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            ).populate('business_id');
            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    // Delete product
    async deleteProduct(id) {
        try {
            const product = await Product.findByIdAndDelete(id);
            if (!product) {
                throw new Error('Product not found');
            }
            return { message: 'Product deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }
}

module.exports = new ProductService();