import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { CreateProductRequest, UpdateProductRequest } from '../types';

const prisma = new PrismaClient();

export class ProductController {
  /**
   * Get all products with pagination and search
   */
  static async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[String(sortBy)] = sortOrder;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  /**
   * Get single product by ID
   */
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  /**
   * Create a new product (Admin only)
   */
  static async createProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description, price, stock, imageUrl }: CreateProductRequest = req.body;

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          imageUrl
        }
      });

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }

  /**
   * Update a product (Admin only)
   */
  static async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const updateData: UpdateProductRequest = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: updateData
      });

      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }

  /**
   * Delete a product (Admin only)
   */
  static async deleteProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.product.delete({
        where: { id }
      });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  /**
   * Get low stock products (Admin only)
   */
  static async getLowStockProducts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { threshold = 10 } = req.query;

      const products = await prisma.product.findMany({
        where: {
          stock: {
            lte: Number(threshold)
          }
        },
        orderBy: {
          stock: 'asc'
        }
      });

      res.json({
        products,
        count: products.length,
        threshold: Number(threshold)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  }
}