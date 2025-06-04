import express from 'express';
import { body } from 'express-validator';
import { OrderController } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: User's orders
 */
router.get('/', authenticateToken, OrderController.getUserOrders);

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Get user's order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics
 */
router.get('/stats', authenticateToken, OrderController.getOrderStats);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticateToken, OrderController.getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place an order from cart items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Cart is empty or insufficient stock
 */
router.post('/', authenticateToken, OrderController.placeOrder);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 */
router.put('/:id/cancel', authenticateToken, OrderController.cancelOrder);

export default router;