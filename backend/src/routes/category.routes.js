/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 */
const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/category.controller');


/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy tất cả category
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Danh sách category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', CategoryController.getAllCategories);
/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Lấy category theo ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.get('/:id', CategoryController.getCategoryById);


module.exports = router;