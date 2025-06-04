import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class WishlistController {
  /**
   * Get user's wishlist
   */
  static async getWishlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [wishlistItems, total] = await Promise.all([
        prisma.wishlistItem.findMany({
          where: { userId: req.user!.id },
          include: {
            product: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.wishlistItem.count({
          where: { userId: req.user!.id }
        })
      ]);

      res.json({
        wishlistItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
  }

  /**
   * Add product to wishlist
   */
  static async addToWishlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Check if already in wishlist
      const existingItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId
          }
        }
      });

      if (existingItem) {
        res.status(400).json({ 
          error: 'Product already in wishlist',
          productId,
          productName: product.name
        });
        return;
      }

      // Add to wishlist
      const wishlistItem = await prisma.wishlistItem.create({
        data: {
          userId: req.user!.id,
          productId
        },
        include: {
          product: true
        }
      });

      res.status(201).json({
        message: 'Product added to wishlist',
        wishlistItem
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  }

  /**
   * Remove product from wishlist
   */
  static async removeFromWishlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      const deletedItem = await prisma.wishlistItem.delete({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId
          }
        }
      });

      res.json({ 
        message: 'Product removed from wishlist',
        productId
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
  }

  /**
   * Move item from wishlist to cart
   */
  static async moveToCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { quantity = 1 } = req.body;

      // Check if product exists and has sufficient stock
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({ 
          error: 'Insufficient stock',
          available: product.stock,
          requested: quantity
        });
        return;
      }

      // Check if item is in wishlist
      const wishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId
          }
        }
      });

      if (!wishlistItem) {
        res.status(404).json({ error: 'Product not in wishlist' });
        return;
      }

      // Transaction: Remove from wishlist and add to cart
      const result = await prisma.$transaction(async (tx) => {
        // Remove from wishlist
        await tx.wishlistItem.delete({
          where: {
            userId_productId: {
              userId: req.user!.id,
              productId
            }
          }
        });

        // Check if already in cart
        const existingCartItem = await tx.cartItem.findUnique({
          where: {
            userId_productId: {
              userId: req.user!.id,
              productId
            }
          }
        });

        if (existingCartItem) {
          // Update cart quantity
          const newQuantity = existingCartItem.quantity + quantity;
          
          if (product.stock < newQuantity) {
            throw new Error('Insufficient stock for total cart quantity');
          }

          return await tx.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: newQuantity },
            include: { product: true }
          });
        } else {
          // Create new cart item
          return await tx.cartItem.create({
            data: {
              userId: req.user!.id,
              productId,
              quantity
            },
            include: { product: true }
          });
        }
      });

      res.json({
        message: 'Product moved from wishlist to cart',
        cartItem: result
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to move to cart' });
    }
  }

  /**
   * Clear entire wishlist
   */
  static async clearWishlist(req: AuthRequest, res: Response): Promise<void> {
    try {
      const deletedCount = await prisma.wishlistItem.deleteMany({
        where: { userId: req.user!.id }
      });

      res.json({
        message: 'Wishlist cleared successfully',
        itemsRemoved: deletedCount.count
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to clear wishlist' });
    }
  }

  /**
   * Check if product is in wishlist
   */
  static async checkWishlistStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      const wishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId
          }
        }
      });

      res.json({
        inWishlist: !!wishlistItem,
        productId
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to check wishlist status' });
    }
  }
}