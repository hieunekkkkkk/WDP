 const express = require('express');
const router = express.Router();
const BusinessController = require('../controllers/business.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         categoryId:
 *           type: string
 *         description:
 *           type: string
 *         rating:
 *           type: number
 */
// ... existing code ...
/**
 * @swagger
 * /api/businesses:
 *   post:
 *     summary: Tạo business mới
 *     tags: [Business]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Business'
 *     responses:
 *       201:
 *         description: Business đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 */
router.post('/', BusinessController.createBusiness);
/**
 * @swagger
 * /api/businesses/filter:
 *   get:
 *     summary: Lọc business
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: Danh sách business đã lọc
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 */
router.get('/filter', BusinessController.filterBusinesses);
/**
 * @swagger
 * /api/businesses:
 *   get:
 *     summary: Lấy tất cả business
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: Danh sách business
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 */
router.get('/', BusinessController.getAllBusinesses);
/**
 * @swagger
 * /api/businesses/rating:
 *   get:
 *     summary: Lấy business kèm rating
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: Danh sách business kèm rating
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 */
router.get('/rating', BusinessController.getAllBusinessesWithRating);
/**
 * @swagger
 * /api/businesses/search:
 *   get:
 *     summary: Tìm kiếm business
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm business
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 */
router.get('/search', BusinessController.searchBusinesses);
/**
 * @swagger
 * /api/businesses/near:
 *   get:
 *     summary: Tìm business gần nhất
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: Danh sách business gần nhất
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 */
router.get('/near', BusinessController.findNearestBusinesses);
/**
 * @swagger
 * /api/businesses/{id}:
 *   get:
 *     summary: Lấy business theo ID
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin business
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 */
router.get('/:id', BusinessController.getBusinessById);
/**
 * @swagger
 * /api/businesses/{id}:
 *   put:
 *     summary: Cập nhật business
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Business'
 *     responses:
 *       200:
 *         description: Business đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 */
router.put('/:id', BusinessController.updateBusiness);
/**
 * @swagger
 * /api/businesses/{id}:
 *   delete:
 *     summary: Xoá business
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business đã được xoá
 */
router.delete('/:id', BusinessController.deleteBusiness);
/**
 * @swagger
 * /api/businesses/category/{categoryId}:
 *   get:
 *     summary: Lấy business theo category
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách business theo category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 */
router.get('/category/:categoryId', BusinessController.getBusinessByCategory);
// ... existing code ...
module.exports = router;