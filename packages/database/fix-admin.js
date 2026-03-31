const { PrismaClient } = require('../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');

const CORRECT_HASH = '$2b$10$5XAd.AQERl2itk2P3Bx7UO/Iv99sbKStDJENDWwR8PVJms7QOa8bC';

async function main() {
  const p = new PrismaClient();
  try {
    const user = await p.user.upsert({
      where: { email: 'admin@wowcado.com' },
      update: { 
        password: CORRECT_HASH,
        isActive: true
      },
      create: {
        email: 'admin@wowcado.com',
        password: CORRECT_HASH,
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
      }
    });
    console.log('SUCCESS: User updated:', user.email, '| isActive:', user.isActive);
    console.log('Login now: admin@wowcado.com / password123');
  } catch(e) {
    console.error('FAILED:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();
