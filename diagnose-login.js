const path = require('path');
const ROOT = __dirname;

const PrismaClient = require('./packages/database/node_modules/@prisma/client').PrismaClient;
const bcrypt = require('./apps/api/node_modules/bcrypt');

const DATABASE_URL = 'postgresql://root:password@localhost:5432/wowcado_erp?schema=public';
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  console.log('\n=== WOWCADO LOGIN DIAGNOSTIC ===\n');
  console.log('DB:', DATABASE_URL);

  await prisma.$connect();
  console.log('✅ DB connection OK\n');

  const user = await prisma.user.findUnique({
    where: { email: 'admin@wowcado.com' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    console.log('❌ USER NOT FOUND — creating...');
    const hash = await bcrypt.hash('password123', 10);
    const role = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' }, update: {},
      create: { name: 'SUPER_ADMIN', description: 'Super Admin', type: 'ADMIN' }
    });
    await prisma.user.create({
      data: { email: 'admin@wowcado.com', password: hash, firstName: 'System', lastName: 'Administrator', isActive: true, userRoles: { create: { roleId: role.id } } }
    });
    console.log('✅ Admin user created. Password: password123');
  } else {
    console.log('✅ User exists | isActive:', user.isActive, '| roles:', user.userRoles.map(ur => ur.role.name));

    if (!user.isActive) {
      await prisma.user.update({ where: { email: 'admin@wowcado.com' }, data: { isActive: true } });
      console.log('✅ Fixed: isActive set to true');
    }

    const hasSuperAdmin = user.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    if (!hasSuperAdmin) {
      const role = await prisma.role.upsert({ where: { name: 'SUPER_ADMIN' }, update: {}, create: { name: 'SUPER_ADMIN', description: 'Super Admin', type: 'ADMIN' } });
      await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
      console.log('✅ Fixed: SUPER_ADMIN role assigned');
    }

    const m1 = await bcrypt.compare('password123', user.password);
    const m2 = await bcrypt.compare('wowcado123', user.password);
    console.log('password123 matches hash:', m1);
    console.log('wowcado123  matches hash:', m2);

    if (!m1) {
      console.log('❌ password123 does NOT match — resetting hash...');
      const hash = await bcrypt.hash('password123', 10);
      await prisma.user.update({ where: { email: 'admin@wowcado.com' }, data: { password: hash } });
      console.log('✅ Password reset to: password123');
    } else {
      console.log('✅ password123 is correct in DB');
    }
  }

  await prisma.$disconnect();

  console.log('\n--- SUMMARY ---');
  console.log('Frontend URL  : http://localhost:3000');
  console.log('API URL       : http://localhost:3001/api/v1');
  console.log('Login endpoint: POST /api/v1/auth/login');
  console.log('Email         : admin@wowcado.com');
  console.log('Password in DB: password123');
  console.log('Password on UI: wowcado123  ← MISMATCH — will be fixed in page.tsx');
}

main().catch(e => { console.error('FATAL:', e.message); prisma.$disconnect(); process.exit(1); });
