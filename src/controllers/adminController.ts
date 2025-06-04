import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        lowStockProducts,
        recentOrders
      ] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.aggregate({
          where: { status: { not: 'CANCELLED' } },
          _sum: { total: true }
        }),
        prisma.order.count({
          where: { status: 'PENDING' }
        }),
        prisma.product.count({
          where: { stock: { lte: 10 } }
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true }
            },
            items: {
              include: {
                product: {
                  select: { name: true }
                }
              }
            }
          }
        })
      ]);

      const stats = {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingOrders,
          lowStockProducts
        },
        recentOrders
      };

      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  }

  /**
   * Get all users with pagination
   */
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, role } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                orders: true,
                cartItems: true,
                wishlistItems: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * Get all orders with advanced filtering
   */
  static async getAllOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        startDate, 
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(String(startDate));
        if (endDate) where.createdAt.lte = new Date(String(endDate));
      }

      if (minAmount || maxAmount) {
        where.total = {};
        if (minAmount) where.total.gte = Number(minAmount);
        if (maxAmount) where.total.lte = Number(maxAmount);
      }

      const orderBy: any = {};
      orderBy[String(sortBy)] = sortOrder;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: { name: true, email: true }
            },
            items: {
              include: {
                product: {
                  select: { name: true, imageUrl: true }
                }
              }
            }
          },
          orderBy,
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
   * Update order status
   */
  static async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          error: 'Invalid status',
          validStatuses
        });
        return;
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: { name: true, email: true }
          },
          items: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        }
      });

      res.json({
        message: 'Order status updated successfully',
        order
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { period = '30d' } = req.query;
      
      let startDate: Date;
      const endDate = new Date();

      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const [
        salesByDay,
        topProducts,
        revenueStats,
        orderStats
      ] = await Promise.all([
        // Sales by day
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders,
            SUM(total) as revenue
          FROM "Order"
          WHERE created_at >= ${startDate}
            AND created_at <= ${endDate}
            AND status != 'CANCELLED'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
        
        // Top selling products
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            quantity: true
          },
          _count: {
            productId: true
          },
          orderBy: {
            _sum: {
              quantity: 'desc'
            }
          },
          take: 10
        }),

        // Revenue statistics
        prisma.order.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: { not: 'CANCELLED' }
          },
          _sum: { total: true },
          _avg: { total: true },
          _count: true
        }),

        // Order status distribution
        prisma.order.groupBy({
          by: ['status'],
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          _count: { status: true }
        })
      ]);

      // Get product details for top products
      const productIds = topProducts.map((p: { productId: any; }) => p.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, imageUrl: true }
      });

      const topProductsWithDetails = topProducts.map((tp: { productId: any; }) => {
        const product = products.find((p: { id: any; }) => p.id === tp.productId);
        return {
          ...tp,
          product
        };
      });

      res.json({
        period,
        salesByDay,
        topProducts: topProductsWithDetails,
        revenue: {
          total: revenueStats._sum.total || 0,
          average: revenueStats._avg.total || 0,
          orderCount: revenueStats._count
        },
        ordersByStatus: orderStats.reduce((acc: { [x: string]: any; }, item: { status: string | number; _count: { status: any; }; }) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch sales analytics' });
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['USER', 'ADMIN'].includes(role)) {
        res.status(400).json({ 
          error: 'Invalid role',
          validRoles: ['USER', 'ADMIN']
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      res.json({
        message: 'User role updated successfully',
        user
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
}