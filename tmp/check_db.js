const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@wowcado.com' },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!user) {
      console.log('USER_NOT_FOUND');
      return;
    }

    console.log('USER_FOUND:', JSON.stringify({
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      roles: user.userRoles.map(ur => ur.role.name)
    }, null, 2));

    const matches = await bcrypt.compare('password123', user.password);
    console.log('PASSWORD_MATCH_PASSWORD123:', matches);
    
    // Also test wowcado123 since the frontend default was that
    const matchesWow = await bcrypt.compare('wowcado123', user.password);
    console.log('PASSWORD_MATCH_WOWCADO123:', matchesWow);

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
