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
    } else {
      console.log('USER_DETAILS:', JSON.stringify({
        email: user.email,
        isActive: user.isActive,
        roles: user.userRoles.map(ur => ur.role.name),
        passwordHash: user.password
      }, null, 2));

      const isPassword123 = await bcrypt.compare('password123', user.password);
      console.log('MATCH_PASSWORD123:', isPassword123);
      
      const isWowcado123 = await bcrypt.compare('wowcado123', user.password);
      console.log('MATCH_WOWCADO123:', isWowcado123);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
