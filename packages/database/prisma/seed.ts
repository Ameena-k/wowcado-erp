import { PrismaClient, RoleType, PermissionAction } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Wowcado ERP Database Seed...');

  const isDemoSeed = process.env.SEED_DEMO_DATA === 'true';
  const adminEmail = process.env.PILOT_ADMIN_EMAIL || 'admin@wowcado.com';
  // Standard bcrypt hash for 'password123'
  const defaultHash = '$2b$10$5XAd.AQERl2itk2P3Bx7UO/Iv99sbKStDJENDWwR8PVJms7QOa8bC';
  const adminPasswordHash = process.env.PILOT_ADMIN_PASSWORD_HASH || defaultHash;

  if (adminPasswordHash === defaultHash) {
    console.warn('⚠️ WARNING: Using insecure default password hash for Pilot Admin. Override with PILOT_ADMIN_PASSWORD_HASH in environment for production.');
  }

  // ==========================================
  // PHASE 1: EXACT BASE/PILOT SEED (CORE DATA)
  // ==========================================

  console.log('1. Seeding core RBAC Roles and Permissions...');
  const pUsersManage = await prisma.permission.upsert({
    where: { action_resource: { action: PermissionAction.MANAGE, resource: 'User' } },
    update: {},
    create: { action: PermissionAction.MANAGE, resource: 'User', description: 'Manage all users' },
  });

  const pRolesManage = await prisma.permission.upsert({
    where: { action_resource: { action: PermissionAction.MANAGE, resource: 'Role' } },
    update: {},
    create: { action: PermissionAction.MANAGE, resource: 'Role', description: 'Manage all roles' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with full access',
      type: RoleType.ADMIN,
    },
  });

  for (const perm of [pUsersManage, pRolesManage]) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  console.log(`2. Seeding Initial Pilot Admin User (${adminEmail})...`);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPasswordHash,
      firstName: 'Pilot',
      lastName: 'Administrator',
      isActive: true,
      userRoles: {
        create: { roleId: adminRole.id }
      }
    }
  });

  console.log('3. Seeding Base Chart of Accounts...');
  const accounts = [
    { code: '1000', name: 'Cash in Hand', type: 'ASSET' as const },
    { code: '1010', name: 'Bank', type: 'ASSET' as const },
    { code: '1020', name: 'Accounts Receivable', type: 'ASSET' as const },
    { code: '1030', name: 'Razorpay Clearing', type: 'ASSET' as const },
    { code: '2000', name: 'Tax Payable', type: 'LIABILITY' as const },
    { code: '2010', name: 'Accounts Payable', type: 'LIABILITY' as const },
    { code: '4000', name: 'Sales', type: 'REVENUE' as const },
    { code: '4010', name: 'Avocado Fruit Sales', type: 'REVENUE' as const },
    { code: '4020', name: 'Milkshake/ready-to-eat product Sales', type: 'REVENUE' as const },
    { code: '4030', name: 'Avocado Oil Sales', type: 'REVENUE' as const },
    { code: '5000', name: 'Office Supplies', type: 'EXPENSE' as const },
    { code: '5010', name: 'Rent', type: 'EXPENSE' as const },
    { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE' as const }
  ];

  const accountMap: Record<string, any> = {};
  for (const acc of accounts) {
    const createdAcc = await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: { code: acc.code, name: acc.name, type: acc.type }
    });
    accountMap[acc.name] = createdAcc;
  }

  console.log('4. Seeding Global Categories, Taxes and Societies...');
  const generalCategory = await prisma.category.upsert({
    where: { name: 'General' },
    update: {},
    create: { name: 'General', description: 'Standard Global Category' }
  });

  const taxRate18 = await prisma.taxRate.upsert({
    where: { name: 'GST 18%' },
    update: {},
    create: { name: 'GST 18%', rate: 18.0 }
  });

  const societyList = [
    "Adarsh Palm Retreat, Bellandur", "Bhavya Lake Vista,Kasavanahalli,Bengaluru", "Brigade Cornerstone Utopia", "Brigade Cosmopolis, Whitefield",
    "Brigade Lakefront, Whitefield", "Brigade Metropolis", "Divyasree 77° East,Yemlur", "Divyasree Elan, Sarjapur Road",
    "Divyasree Republic of Whitefield", "DNR Atmosphere,Whitefield,Bengaluru", "Embassy Pristine, Bellandur", "Gopalan Atlantis,Whitefield,Bengaluru",
    "Gran Carmen,Chikkabellandur,Bengaluru", "Keerthi Gardenia,Thubarahalli,Bengaluru", "LGCL Ashlar, Hosa Road", "Nagarjuna Green Ridge,HSR Layout",
    "ND Passion, Haralur Road", "Orchid Whitefield,Whitefiled,Bengaluru", "Ozone Residenza", "Palm Meadows,Whitefield,Bengaluru",
    "Prestige Falcon City", "Prestige Jindal City", "Prestige Lakeside Habitat", "Prestige Park Grove", "Prestige Song of the South",
    "Prestige Waterford", "Puravankara Purva Westend", "Purva Fountain Square, Marathahalli", "Purva Park Hill", "Purva Palm Beach",
    "Purva Riviera", "Purva Sunshine", "Purva Westend", "Purva Windermere", "Rohan Ashima", "Salarpuria Greenage",
    "Saroj Bluebells,Whitefield,Bengaluru", "Shriram Chirping Woods", "Shriram Greenfield", "Sobha Dream Acres", "Sobha Insignia",
    "Sobha Neopolis", "SNN Raj Etternia,Haralur Road,Bengaluru", "SSVR Fairy Bells,Panathur,Bengaluru", "Total Environment Pursuit of a Radical Rhapsody",
    "Trifecta Starlight", "Vaswani Exquisite", "Vaswani Menlo Park", "Vaswani Reserve", "Vaswani Starlight", "Vibgyor High Kadugodi",
    "Windmills of Your Mind,Whitefield,Bengaluru", "Yashomati Hospital, Marathahalli", "Zonasha Elegance,Haralur Road,Bengaluru", "zonasha vista"
  ];
  for (const s of societyList) {
    await prisma.society.upsert({
      where: { name: s },
      update: {},
      create: { name: s, isActive: true }
    });
  }

  // ==========================================
  // PHASE 2: DEV/DEMO SEED (DUMMY TRANSACTIONS)
  // ==========================================
  
  if (!isDemoSeed) {
    console.log('✅ Base/Pilot Seed complete. Skipping Dummy Demo Transaction generation.');
    return;
  }

  console.log('==============================================');
  console.log('🔨 INITIATING DUMMY DEMO TRANSACTION INJECTIONS...');
  console.log('==============================================');

  const product = await prisma.product.upsert({
    where: { sku: 'PROD-001' },
    update: { active: isDemoSeed }, // De-activate demo item if going into production
    create: { sku: 'PROD-001', name: 'Premium Avocado', unit: 'Box', sellingPrice: 1500.0, categoryId: generalCategory.id, taxRateId: taxRate18.id, active: isDemoSeed }
  });

  const customer = await prisma.customer.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: { name: 'Demo John Doe', phone: '9876543210', email: 'john@example.com' }
  });

  const testSociety = await prisma.society.findFirst({ where: { name: 'Brigade Metropolis' } });
  
  const address = await prisma.customerAddress.create({
    data: {
      customerId: customer.id,
      societyId: testSociety!.id,
      recipientName: 'John Home',
      phone: '9876543210',
      blockOrStreet: 'Tower 4',
      doorNo: 'Apt 101'
    }
  });

  const dZone = await prisma.deliveryZone.create({
    data: { name: 'Downtown', pincode: '560001', deliveryCharge: 50.0 }
  });

  const dSlot = await prisma.deliverySlot.create({
    data: { name: 'Morning', displayName: '9AM to 12PM', startTime: new Date('2025-01-01T09:00:00Z'), endTime: new Date('2025-01-01T12:00:00Z') }
  });

  let order = await prisma.order.findUnique({ where: { orderNumber: 'ORD-SEED-001' } });
  if (!order) {
    order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-SEED-001', customerId: customer.id, customerAddressId: address.id, deliveryZoneId: dZone.id, deliverySlotId: dSlot.id,
        orderDate: new Date(), deliveryDate: new Date(), subtotal: 1500.0, taxableAmount: 1500.0, deliveryCharge: 50.0, taxTotal: 270.0, grandTotal: 1820.0,
        orderItems: { create: [ { productId: product.id, productNameSnapshot: product.name, skuSnapshot: product.sku, quantity: 1, unitPrice: product.sellingPrice, taxRateSnapshot: taxRate18.rate, taxableLineAmount: 1500.0, taxAmount: 270.0, lineTotal: 1770.0 } ] }
      }
    });
  }

  let invoice = await prisma.invoice.findUnique({ where: { invoiceNumber: 'INV-SEED-001' } });
  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-SEED-001', orderId: order.id, customerId: customer.id, invoiceDate: new Date(), status: 'ISSUED',
        subtotal: order.subtotal, taxTotal: order.taxTotal, grandTotal: order.grandTotal, balanceDue: order.grandTotal,
        invoiceItems: { create: [ { productId: product.id, productNameSnapshot: product.name, skuSnapshot: product.sku, quantity: 1, unitPrice: product.sellingPrice, taxRateSnapshot: taxRate18.rate, taxAmount: 270.0, lineTotal: 1770.0 } ] }
      }
    });
  }

  let payment = await prisma.customerPayment.findUnique({ where: { paymentNumber: 'PAY-SEED-001' } });
  if (!payment) {
    payment = await prisma.customerPayment.create({
      data: {
        paymentNumber: 'PAY-SEED-001', customerId: customer.id, paymentDate: new Date(), amount: 1000.0, allocatedAmount: 1000.0, unallocatedAmount: 0.0,
        paymentMethod: 'BANK', referenceNumber: 'REF123456', status: 'COMPLETED', allocations: { create: [ { invoiceId: invoice.id, allocatedAmount: 1000.0 } ] }
      }
    });
    await prisma.invoice.update({ where: { id: invoice.id }, data: { paidAmount: 1000.0, balanceDue: Number(invoice.grandTotal) - 1000.0, status: 'PARTIALLY_PAID' } });
  }

  console.log('✅ Demo Dummy Transactions & Models Generated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
