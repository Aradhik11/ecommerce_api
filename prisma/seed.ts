import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@ecommerce.com',
        password: adminPassword,
        name: 'System Administrator',
        role: Role.ADMIN
      }
    });

    // Create Regular Users
    console.log('👥 Creating regular users...');
    const userPassword = await bcrypt.hash('user123', 12);
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'john.doe@example.com',
          password: userPassword,
          name: 'John Doe',
          role: Role.USER
        }
      }),
      prisma.user.create({
        data: {
          email: 'jane.smith@example.com',
          password: userPassword,
          name: 'Jane Smith',
          role: Role.USER
        }
      }),
      prisma.user.create({
        data: {
          email: 'mike.johnson@example.com',
          password: userPassword,
          name: 'Mike Johnson',
          role: Role.USER
        }
      }),
      prisma.user.create({
        data: {
          email: 'sarah.wilson@example.com',
          password: userPassword,
          name: 'Sarah Wilson',
          role: Role.USER
        }
      })
    ]);

    // Create Products
    console.log('📦 Creating products...');
    const products = [
      {
        name: 'MacBook Pro 16" M3',
        description: 'Apple MacBook Pro 16-inch with M3 Pro chip, 18GB RAM, 512GB SSD. Perfect for professional development and creative work.',
        price: 2499.99,
        stock: 15,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310'
      },
      {
        name: 'iPhone 15 Pro Max',
        description: 'Latest iPhone with A17 Pro chip, 256GB storage, titanium design, and advanced camera system.',
        price: 1199.99,
        stock: 32,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309'
      },
      {
        name: 'AirPods Pro (3rd Gen)',
        description: 'Wireless earbuds with active noise cancellation, spatial audio, and MagSafe charging case.',
        price: 249.99,
        stock: 78,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83'
      },
      {
        name: 'iPad Air 11" M2',
        description: 'Powerful and versatile iPad Air with M2 chip, 128GB storage, and support for Apple Pencil Pro.',
        price: 599.99,
        stock: 25,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-finish-select-gallery-202405'
      },
      {
        name: 'Apple Watch Series 9',
        description: 'Most advanced Apple Watch with S9 chip, always-on Retina display, and comprehensive health tracking.',
        price: 399.99,
        stock: 41,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s9-finish-select-202309'
      },
      {
        name: 'Magic Keyboard for iPad Pro',
        description: 'Premium keyboard with trackpad, backlit keys, and floating cantilever design for iPad Pro.',
        price: 349.99,
        stock: 18,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MJQJ3'
      },
      {
        name: 'Apple Studio Display',
        description: '27-inch 5K Retina display with 600 nits brightness, P3 wide color gamut, and built-in camera.',
        price: 1599.99,
        stock: 8,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/studio-display-gallery-1-202203'
      },
      {
        name: 'Mac Studio M2 Ultra',
        description: 'Compact powerhouse with M2 Ultra chip, 64GB unified memory, and 1TB SSD for professional workflows.',
        price: 3999.99,
        stock: 5,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mac-studio-select-202306'
      },
      {
        name: 'AirTag 4-Pack',
        description: 'Precision finding device to help locate your items with the Find My network.',
        price: 99.99,
        stock: 156,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airtag-4pack-select-202104'
      },
      {
        name: 'HomePod mini',
        description: 'Smart speaker with Siri, room-filling sound, and seamless integration with Apple devices.',
        price: 99.99,
        stock: 63,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/homepod-mini-select-orange-202110'
      },
      {
        name: 'Apple Pencil Pro',
        description: 'Next-generation Apple Pencil with advanced features, haptic feedback, and squeeze gesture.',
        price: 129.99,
        stock: 34,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/apple-pencil-pro-hero-202405'
      },
      {
        name: 'MagSafe Charger',
        description: 'Wireless charger with perfectly aligned magnets for iPhone 12 and later models.',
        price: 39.99,
        stock: 89,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MHXH3'
      },
      {
        name: 'MacBook Air 15" M3',
        description: 'Incredibly thin and light laptop with M3 chip, 8GB RAM, 256GB SSD, and all-day battery life.',
        price: 1299.99,
        stock: 22,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202306'
      },
      {
        name: 'iPhone 15',
        description: 'Essential iPhone with A16 Bionic chip, advanced dual-camera system, and USB-C connectivity.',
        price: 799.99,
        stock: 47,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309'
      },
      {
        name: 'Apple TV 4K',
        description: 'Entertainment device with A15 Bionic chip, 4K HDR video, and Dolby Atmos audio support.',
        price: 179.99,
        stock: 31,
        imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/apple-tv-4k-hero-select-202210'
      }
    ];

    const createdProducts = await Promise.all(
      products.map(product => prisma.product.create({ data: product }))
    );

    console.log(`✅ Created ${createdProducts.length} products`);

    // Add some products to users' carts
    console.log('🛒 Adding items to carts...');
    
    // John's cart
    await prisma.cartItem.createMany({
      data: [
        {
          userId: users[0].id,
          productId: createdProducts[0].id, // MacBook Pro
          quantity: 1
        },
        {
          userId: users[0].id,
          productId: createdProducts[2].id, // AirPods Pro
          quantity: 2
        }
      ]
    });

    // Jane's cart
    await prisma.cartItem.createMany({
      data: [
        {
          userId: users[1].id,
          productId: createdProducts[1].id, // iPhone 15 Pro Max
          quantity: 1
        },
        {
          userId: users[1].id,
          productId: createdProducts[4].id, // Apple Watch
          quantity: 1
        }
      ]
    });

    // Add items to wishlists
    console.log('💝 Adding items to wishlists...');
    
    // John's wishlist
    await prisma.wishlistItem.createMany({
      data: [
        {
          userId: users[0].id,
          productId: createdProducts[6].id // Studio Display
        },
        {
          userId: users[0].id,
          productId: createdProducts[7].id // Mac Studio
        }
      ]
    });

    // Jane's wishlist
    await prisma.wishlistItem.createMany({
      data: [
        {
          userId: users[1].id,
          productId: createdProducts[3].id // iPad Air
        },
        {
          userId: users[1].id,
          productId: createdProducts[5].id // Magic Keyboard
        }
      ]
    });

    // Mike's wishlist
    await prisma.wishlistItem.createMany({
      data: [
        {
          userId: users[2].id,
          productId: createdProducts[12].id // MacBook Air
        },
        {
          userId: users[2].id,
          productId: createdProducts[14].id // Apple TV
        }
      ]
    });

    // Create some sample orders
    console.log('📋 Creating sample orders...');

    // Sarah's completed order
    const order1 = await prisma.order.create({
      data: {
        userId: users[3].id,
        total: 1499.98,
        status: OrderStatus.DELIVERED,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }
    });

    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order1.id,
          productId: createdProducts[13].id, // iPhone 15
          quantity: 1,
          price: 799.99
        },
        {
          orderId: order1.id,
          productId: createdProducts[9].id, // HomePod mini
          quantity: 2,
          price: 99.99
        },
        {
          orderId: order1.id,
          productId: createdProducts[0].id, // MacBook Pro (cancelled item)
          quantity: 1,
          price: 2499.99
        }
      ]
    });

    // Mike's pending order
    const order2 = await prisma.order.create({
      data: {
        userId: users[2].id,
        total: 1649.97,
        status: OrderStatus.PROCESSING,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    });

    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order2.id,
          productId: createdProducts[12].id, // MacBook Air
          quantity: 1,
          price: 1299.99
        },
        {
          orderId: order2.id,
          productId: createdProducts[2].id, // AirPods Pro
          quantity: 1,
          price: 249.99
        },
        {
          orderId: order2.id,
          productId: createdProducts[11].id, // MagSafe Charger
          quantity: 1,
          price: 39.99
        }
      ]
    });

    // Jane's recent order
    const order3 = await prisma.order.create({
      data: {
        userId: users[1].id,
        total: 2999.97,
        status: OrderStatus.SHIPPED,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    });

    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order3.id,
          productId: createdProducts[0].id, // MacBook Pro
          quantity: 1,
          price: 2499.99
        },
        {
          orderId: order3.id,
          productId: createdProducts[2].id, // AirPods Pro
          quantity: 1,
          price: 249.99
        },
        {
          orderId: order3.id,
          productId: createdProducts[11].id, // MagSafe Charger
          quantity: 1,
          price: 39.99
        }
      ]
    });

    // Update product stock based on orders
    console.log('📊 Updating product stock...');
    await prisma.product.update({
      where: { id: createdProducts[0].id }, // MacBook Pro
      data: { stock: { decrement: 2 } } // 2 units sold
    });

    await prisma.product.update({
      where: { id: createdProducts[2].id }, // AirPods Pro
      data: { stock: { decrement: 2 } } // 2 units sold
    });

    await prisma.product.update({
      where: { id: createdProducts[11].id }, // MagSafe Charger
      data: { stock: { decrement: 2 } } // 2 units sold
    });

    await prisma.product.update({
      where: { id: createdProducts[12].id }, // MacBook Air
      data: { stock: { decrement: 1 } } // 1 unit sold
    });

    await prisma.product.update({
      where: { id: createdProducts[13].id }, // iPhone 15
      data: { stock: { decrement: 1 } } // 1 unit sold
    });

    await prisma.product.update({
      where: { id: createdProducts[9].id }, // HomePod mini
      data: { stock: { decrement: 2 } } // 2 units sold
    });

    // Create some low stock products for admin alerts
    await prisma.product.update({
      where: { id: createdProducts[7].id }, // Mac Studio
      data: { stock: 3 } // Low stock
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Seeded Data Summary:');
    console.log(`👤 Users: ${users.length + 1} (${users.length} regular + 1 admin)`);
    console.log(`📦 Products: ${createdProducts.length}`);
    console.log(`🛒 Cart Items: 4 items across 2 users`);
    console.log(`💝 Wishlist Items: 6 items across 3 users`);
    console.log(`📋 Orders: 3 orders with different statuses`);
    
    console.log('\n🔐 Default Login Credentials:');
    console.log('👑 Admin:');
    console.log('   Email: admin@ecommerce.com');
    console.log('   Password: admin123');
    console.log('\n👤 Regular Users:');
    console.log('   Email: john.doe@example.com | Password: user123');
    console.log('   Email: jane.smith@example.com | Password: user123');
    console.log('   Email: mike.johnson@example.com | Password: user123');
    console.log('   Email: sarah.wilson@example.com | Password: user123');

    console.log('\n🛍️ Sample Data:');
    console.log('- John has MacBook Pro + AirPods in cart, Studio Display + Mac Studio in wishlist');
    console.log('- Jane has iPhone + Apple Watch in cart, iPad + Magic Keyboard in wishlist');
    console.log('- Mike has MacBook Air + Apple TV in wishlist, recent order processing');
    console.log('- Sarah has completed order with iPhone 15 + accessories');

    console.log('\n🎯 Ready to test all endpoints!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });