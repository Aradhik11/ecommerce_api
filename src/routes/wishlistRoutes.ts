import express from 'express';
import { body } from 'express-validator';
import { WishlistController } from '../controllers/wishlistController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
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
 *           default: 20
 *     responses:
 *       200:
 *         description: User's wishlist items
 */
router.get('/', authenticateToken, WishlistController.getWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Product added to wishlist
 *       400:
 *         description: Product already in wishlist
 *       404:
 *         description: Product not found
 */
router.post('/:productId', authenticateToken, WishlistController.addToWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
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
 *         description: Product removed from wishlist
 *       404:
 *         description: Product not in wishlist
 */
router.delete('/:productId', authenticateToken, WishlistController.removeFromWishlist);

/**
 * @swagger
 * /wishlist/{productId}/move-to-cart:
 *   post:
 *     summary: Move item from wishlist to cart
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *     responses:
 *       200:
 *         description: Product moved to cart
 *       400:
 *         description: Insufficient stock
 */
router.post('/:productId/move-to-cart', 
  authenticateToken,
  [body('quantity').optional().isInt({ min: 1 })],
  WishlistController.moveToCart
);

/**
 * @swagger
 * /wishlist/{productId}/check:
 *   get:
 *     summary: Check if product is in wishlist
 *     tags: [Wishlist]
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
 *         description: Wishlist status
 */
router.get('/:productId/check', authenticateToken, WishlistController.checkWishlistStatus);

/**
 * @swagger
 * /wishlist/clear:
 *   delete:
 *     summary: Clear entire wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 */
router.delete('/clear/all', authenticateToken, WishlistController.clearWishlist);

export default router;