const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         status:
 *           type: string
 */
router.get('/', UserController.getAllUsers);
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy tất cả user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Danh sách user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/:userId', UserController.getUser);
/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Cập nhật user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.put('/:userId', UserController.updateUser);
/**
 * @swagger
 * /api/users/{userId}/lock:
 *   put:
 *     summary: Khoá user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User đã bị khoá
 */
router.put('/:userId/lock', UserController.lockUser);
/**
 * @swagger
 * /api/users/{userId}/unlock:
 *   put:
 *     summary: Mở khoá user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User đã được mở khoá
 */
router.put('/:userId/unlock', UserController.unlockUser);
module.exports = router;