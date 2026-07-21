import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database initial state...');

  // 1. Seed Roles & Permissions
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Full Administrative Privileges',
    },
  });

  const productManagerRole = await prisma.role.upsert({
    where: { name: 'PRODUCT_MANAGER' },
    update: {},
    create: {
      name: 'PRODUCT_MANAGER',
      description: 'Manage Product Catalog',
    },
  });

  const orderManagerRole = await prisma.role.upsert({
    where: { name: 'ORDER_MANAGER' },
    update: {},
    create: {
      name: 'ORDER_MANAGER',
      description: 'Manage Order Fulfillments and Deliveries',
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: 'Standard Store Customer',
    },
  });

  console.log('Roles seeded successfully.');

  // 2. Create Initial Admin User
  const adminEmail = 'admin@nexus.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        isEmailVerified: true,
      },
    });

    // Link admin user to SUPER_ADMIN role
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    });
    console.log('Initial administrative account created: admin@nexus.com / admin123');
  }

  // 3. Seed Categories & Brands
  const category1 = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
    },
  });

  const category2 = await prisma.category.upsert({
    where: { slug: 'footwear' },
    update: {},
    create: {
      name: 'Footwear',
      slug: 'footwear',
    },
  });

  const brand1 = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: {
      name: 'Apple',
      slug: 'apple',
      description: 'Premium personal computing devices',
    },
  });

  const brand2 = await prisma.brand.upsert({
    where: { name: 'Nike' },
    update: {},
    create: {
      name: 'Nike',
      slug: 'nike',
      description: 'Athletic footwear and apparel',
    },
  });

  console.log('Metadata Categories & Brands seeded.');

  // 4. Seed a Sample Product with Variant and Inventory
  const sampleProductSlug = 'iphone-15-pro-max';
  const existingProduct = await prisma.product.findUnique({
    where: { slug: sampleProductSlug },
  });

  if (!existingProduct) {
    const product = await prisma.product.create({
      data: {
        name: 'iPhone 15 Pro Max',
        slug: sampleProductSlug,
        description: 'Titanium design, powerful A17 Pro chip, customisable Action button, and a powerful camera.',
        basePrice: 1199.99,
        categoryId: category1.id,
        brandId: brand1.id,
        status: 'PUBLISHED',
      },
    });

    // Create a variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: 'APL-IP15-BLK-256',
        price: 1199.99,
        color: 'Black Titanium',
        size: '256GB',
        isActive: true,
      },
    });

    // Create a mock warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Primary NY Warehouse',
        code: 'WH-NY-01',
        isActive: true,
      },
    });

    // Seed inventory entry
    await prisma.inventory.create({
      data: {
        variantId: variant.id,
        warehouseId: warehouse.id,
        quantity: 50,
        reservedQuantity: 0,
      },
    });

    console.log('Sample product, variant, warehouse, and inventory seeded.');
  }

  console.log('Seeding operations completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
