/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         productId:
 *           type: string
 *         businessId:
 *           type: string
 *         content:
 *           type: string
 *         rating:
 *           type: number
 *         like:
 *           type: number
 *         dislike:
 *           type: number
 *         response:
 *           type: string
 */
const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedback.controller');

/**
 * @swagger
 * /api/feedbacks:
 *   post:
 *     summary: Tạo feedback mới
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Feedback'
 *     responses:
 *       201:
 *         description: Feedback đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 */
router.post('/', FeedbackController.createFeedback);
/**
 * @swagger
 * /api/feedbacks:
 *   get:
 *     summary: Lấy tất cả feedback
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Danh sách feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 */
router.get('/', FeedbackController.getAllFeedbacks);
/**
 * @swagger
 * /api/feedbacks/{id}:
 *   get:
 *     summary: Lấy feedback theo ID
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin feedback
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 */
router.get('/:id', FeedbackController.getFeedbackById);
/**
 * @swagger
 * /api/feedbacks/business/{businessId}:
 *   get:
 *     summary: Lấy feedback theo businessId
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách feedback theo business
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 */
router.get('/business/:businessId', FeedbackController.getFeedbackByBusinessId);
/**
 * @swagger
 * /api/feedbacks/product/{productId}:
 *   get:
 *     summary: Lấy feedback theo productId
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách feedback theo sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 */
router.get('/product/:productId', FeedbackController.getFeedbackByProductId);
/**
 * @swagger
 * /api/feedbacks/{id}:
 *   put:
 *     summary: Cập nhật feedback
 *     tags: [Feedback]
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
 *             $ref: '#/components/schemas/Feedback'
 *     responses:
 *       200:
 *         description: Feedback đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 */
router.put('/:id', FeedbackController.updateFeedback);
/**
 * @swagger
 * /api/feedbacks/{id}:
 *   delete:
 *     summary: Xoá feedback
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback đã được xoá
 */
router.delete('/:id', FeedbackController.deleteFeedback);
/**
 * @swagger
 * /api/feedbacks/{id}/like:
 *   patch:
 *     summary: Tăng like cho feedback
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã tăng like
 */
router.patch('/:id/like', FeedbackController.incrementLike);
/**
 * @swagger
 * /api/feedbacks/{id}/dislike:
 *   patch:
 *     summary: Tăng dislike cho feedback
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã tăng dislike
 */
router.patch('/:id/dislike', FeedbackController.incrementDislike);
/**
 * @swagger
 * /api/feedbacks/{id}/response:
 *   patch:
 *     summary: Phản hồi feedback
 *     tags: [Feedback]
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
 *             type: object
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đã phản hồi feedback
 */
router.patch('/:id/response', FeedbackController.updateFeedbackResponse);

module.exports = router;