import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AddToCartRequest, UpdateCartRequest } from '../types';

const prisma = new PrismaClient();

export class CartController {
  /**
   * Get user's cart with total
   */
  static async getCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: req.user!.id },
        include: {
          product: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      res.json({ 
        cartItems, 
        total: Math.round(total * 100) / 100, // Round to 2 decimal places
        itemCount
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }

  /**
   * Add product to cart
   */
  static async addToCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { productId, quantity }: AddToCartRequest = req.body;

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

      // Check if item already exists in cart
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId
          }
        }
      });

      if (existingCartItem) {
        // Update quantity
        const newQuantity = existingCartItem.quantity + quantity;
        
        if (product.stock < newQuantity) {
          res.status(400).json({ 
            error: 'Insufficient stock for total quantity', 
            available: product.stock,
            currentInCart: existingCartItem.quantity,
            requestedToAdd: quantity,
            totalRequested: newQuantity
          });
          return;
        }

        const updatedCartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: newQuantity },
          include: { product: true }
        });

        res.json({
          message: 'Cart item quantity updated',
          cartItem: updatedCartItem
        });
      } else {
        // Create new cart item
        const cartItem = await prisma.cartItem.create({
          data: {
            userId: req.user!.id,
            productId,
            quantity
          },
          include: { product: true }
        });

        res.status(201).json({
          message: 'Product added to cart',
          cartItem
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { productId } = req.params;
      const { quantity }: UpdateCartRequest = req.body;

      // Check product stock
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

      const cartItem = await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId
          }
        },
        data: { quantity },
        include: { product: true }
      });

      res.json({
        message: 'Cart item updated',
        cartItem
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  }

  /**
   * Remove product from cart
   */
  static async removeFromCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId: req.user!.id,
            productId
          }
        }
      });

      res.json({ message: 'Product removed from cart' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to remove from cart' });
    }
  }

  /**
   * Clear entire cart
   */
  static async clearCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const deletedCount = await prisma.cartItem.deleteMany({
        where: { userId: req.user!.id }
      });

      res.json({ 
        message: 'Cart cleared successfully',
        itemsRemoved: deletedCount.count
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }
}