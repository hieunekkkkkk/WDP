/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         amount:
 *           type: number
 *         status:
 *           type: string
 *         transactionId:
 *           type: string
 */
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/authMiddleware');
/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Tạo payment mới
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       201:
 *         description: Payment đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */
router.post('/', PaymentController.createPayment);
/**
 * @swagger
 * /api/payments/callback:
 *   get:
 *     summary: Xử lý callback thanh toán
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Callback xử lý thành công
 */
router.get('/callback', PaymentController.handlePaymentCallback);
/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Lấy tất cả payment
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Danh sách payment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
// Get all payments
router.get('/', PaymentController.getAllPayments);
/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Lấy payment theo ID
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin payment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */
// Get payment by ID
router.get('/:id', PaymentController.getPaymentById);
/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Cập nhật payment
 *     tags: [Payment]
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
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Payment đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */
// Update payment
router.put('/:id', PaymentController.updatePayment);
/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Xoá payment
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment đã được xoá
 */
// Delete payment
router.delete('/:id', PaymentController.deletePayment);
/**
 * @swagger
 * /api/payments/{id}/transaction:
 *   patch:
 *     summary: Cập nhật transactionId cho payment
 *     tags: [Payment]
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
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đã cập nhật transactionId
 */
// Update transaction ID
router.patch('/:id/transaction', PaymentController.updateTransactionId);
/**
 * @swagger
 * /api/payments/userid/{user_id}:
 *   get:
 *     summary: Lấy payment theo userId
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách payment theo user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
// Search by user_id
router.get('/userid/:user_id', PaymentController.getPaymentsByUserId);

module.exports = router;