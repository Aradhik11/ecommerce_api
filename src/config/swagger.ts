import swaggerJsdoc from 'swagger-jsdoc';


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'A comprehensive e-commerce backend API with authentication, products, cart, orders, and wishlist functionality',
      contact: {
        name: 'API Support',
        email: 'aradhik11@gmail.com'
      }
    },
    servers: [
      
      {
        url: 'https://ecommerce-api-ljej.onrender.com/api',

        description: 'Production server'
      },
      {
        url: 'http://localhost:3000/api',

        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            stock: { type: 'integer', minimum: 0 },
            imageUrl: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
            product: { $ref: '#/components/schemas/Product' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            total: { type: 'number', minimum: 0 },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
            createdAt: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' }
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
            price: { type: 'number', minimum: 0 },
            product: { $ref: '#/components/schemas/Product' }
          }
        },
        WishlistItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            product: { $ref: '#/components/schemas/Product' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/server.ts']
};

export const specs = swaggerJsdoc(options);