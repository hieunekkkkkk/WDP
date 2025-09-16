/**
 * @swagger
 * components:
 *   schemas:
 *     Stack:
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
const StackController = require('../controllers/stack.controller');


/**
 * @swagger
 * /api/stacks:
 *   get:
 *     summary: Lấy tất cả stack
 *     tags: [Stack]
 *     responses:
 *       200:
 *         description: Danh sách stack
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stack'
 */
router.get('/', StackController.getAllStacks);
/**
 * @swagger
 * /api/stacks/{id}:
 *   get:
 *     summary: Lấy stack theo ID
 *     tags: [Stack]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin stack
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stack'
 */
router.get('/:id', StackController.getStackById);


module.exports = router;