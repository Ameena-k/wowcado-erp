import { PrismaClient } from '@wowcado/database';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding authentication roles and users...');

  // Roles
  const roles = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATIONS'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, type: 'ADMIN' },
    });
  }

  // Users
  const passwordHash = await bcrypt.hash('wowcado123', 10);
  
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const opsRole = await prisma.role.findUnique({ where: { name: 'OPERATIONS' } });
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@wowcado.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@wowcado.com',
      password: passwordHash,
      firstName: 'Pilot',
      lastName: 'Admin',
    },
  });

  const opsUser = await prisma.user.upsert({
    where: { email: 'ops@wowcado.com' },
    update: { password: passwordHash },
    create: {
      email: 'ops@wowcado.com',
      password: passwordHash,
      firstName: 'Pilot',
      lastName: 'Operations',
    },
  });

  // Assign roles
  await prisma.userRole.upsert({
     where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
     update: {},
     create: { userId: adminUser.id, roleId: adminRole.id }
  });
  
  await prisma.userRole.upsert({
     where: { userId_roleId: { userId: opsUser.id, roleId: opsRole.id } },
     update: {},
     create: { userId: opsUser.id, roleId: opsRole.id }
  });

  console.log('Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
