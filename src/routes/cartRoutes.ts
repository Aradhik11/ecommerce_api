import express from 'express';
import { body } from 'express-validator';
import { CartController } from '../controllers/cartController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart items
 */
router.get('/', authenticateToken, CartController.getCart);

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Product added to cart
 *       400:
 *         description: Invalid request or insufficient stock
 */
router.post('/', 
  authenticateToken, 
  [
    body('productId').notEmpty(),
    body('quantity').isInt({ min: 1 })
  ],
  CartController.addToCart
);

/**
 * @swagger
 * /cart/{productId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated
 *       404:
 *         description: Cart item not found
 */
router.put('/:productId', 
  authenticateToken, 
  [body('quantity').isInt({ min: 1 })],
  CartController.updateCartItem
);

/**
 * @swagger
 * /cart/{productId}:
 *   delete:
 *     summary: Remove product from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from cart
 *       404:
 *         description: Cart item not found
 */
router.delete('/:productId', authenticateToken, CartController.removeFromCart);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/clear/all', authenticateToken, CartController.clearCart);

export default router;