import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class OrderController {
  /**
   * Get user's orders with pagination
   */
  static async getUserOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { userId: req.user!.id };
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  /**
   * Get a specific order by ID
   */
  static async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId: req.user!.id
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  /**
   * Place an order from cart items
   */
  static async placeOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get cart items
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: req.user!.id },
        include: { product: true }
      });

      if (cartItems.length === 0) {
        res.status(400).json({ error: 'Cart is empty' });
        return;
      }

      // Check stock availability for all items
      const stockErrors: string[] = [];
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          stockErrors.push(`Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Required: ${item.quantity}`);
        }
      }

      if (stockErrors.length > 0) {
        res.status(400).json({ 
          error: 'Stock validation failed',
          details: stockErrors
        });
        return;
      }

      // Calculate total
      const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

      // Create order in transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId: req.user!.id,
            total: Math.round(total * 100) / 100, // Round to 2 decimal places
            status: 'PENDING'
          }
        });

        // Create order items and update product stock
        for (const item of cartItems) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price
            }
          });

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }

        // Clear cart
        await tx.cartItem.deleteMany({
          where: { userId: req.user!.id }
        });

        return newOrder;
      });

      // Fetch complete order with items
      const completeOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      res.status(201).json({
        message: 'Order placed successfully',
        order: completeOrder
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to place order' });
    }
  }

  /**
   * Cancel an order (if still pending)
   */
  static async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Find the order
      const order = await prisma.order.findFirst({
        where: {
          id,
          userId: req.user!.id
        },
        include: {
          items: true
        }
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status !== 'PENDING') {
        res.status(400).json({ 
          error: 'Order cannot be cancelled',
          reason: `Order is already ${order.status.toLowerCase()}`
        });
        return;
      }

      // Cancel order and restore stock
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id },
          data: { status: 'CANCELLED' }
        });

        // Restore product stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      });

      res.json({ 
        message: 'Order cancelled successfully',
        orderId: id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }

  /**
   * Get order statistics for user
   */
  static async getOrderStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [totalOrders, totalSpent, ordersByStatus] = await Promise.all([
        prisma.order.count({
          where: { userId: req.user!.id }
        }),
        prisma.order.aggregate({
          where: { 
            userId: req.user!.id,
            status: { not: 'CANCELLED' }
          },
          _sum: { total: true }
        }),
        prisma.order.groupBy({
          by: ['status'],
          where: { userId: req.user!.id },
          _count: { status: true }
        })
      ]);

      const stats = {
        totalOrders,
        totalSpent: totalSpent._sum.total || 0,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch order statistics' });
    }
  }
}