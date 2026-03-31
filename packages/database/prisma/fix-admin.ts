import { PrismaClient } from '@prisma/client';
// bcrypt lives in the root node_modules via pnpm hoisting
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Check user existence
  const user = await prisma.user.findUnique({
    where: { email: 'admin@wowcado.com' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    console.log('USER NOT FOUND - needs seeding');
    return;
  }

  console.log('User found:', {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    roles: user.userRoles.map(ur => ur.role.name),
    passwordHash: user.password.substring(0, 15) + '...'
  });

  // Test hash against 'password123'
  const match = await bcrypt.compare('password123', user.password);
  console.log('Hash matches "password123":', match);

  if (!match) {
    console.log('Hash DOES NOT match. Updating to correct hash...');
    const correctHash = await bcrypt.hash('password123', 10);
    await prisma.user.update({
      where: { email: 'admin@wowcado.com' },
      data: { password: correctHash }
    });
    console.log('Password hash updated. Login should work now.');
  } else {
    console.log('Hash is correct. Login should work.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
