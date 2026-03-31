const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('./node_modules/bcrypt');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://root:password@localhost:5432/wowcado_erp?schema=public' } }
});

async function check() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@wowcado.com' },
      include: { userRoles: { include: { role: true } } }
    });

    if (!user) {
      console.log('RESULT: USER_NOT_FOUND - needs seeding');
      return;
    }

    console.log('RESULT: USER_FOUND');
    console.log('isActive:', user.isActive);
    console.log('roles:', user.userRoles.map(ur => ur.role.name));
    console.log('passwordHash:', user.password.substring(0, 20) + '...');

    const m1 = await bcrypt.compare('password123', user.password);
    const m2 = await bcrypt.compare('wowcado123', user.password);
    console.log('password123 matches:', m1);
    console.log('wowcado123 matches:', m2);

    if (!m1 && !m2) {
      console.log('FIXING: updating password to password123...');
      const hash = await bcrypt.hash('password123', 10);
      await prisma.user.update({ where: { email: 'admin@wowcado.com' }, data: { password: hash, isActive: true } });
      console.log('DONE: password updated');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
