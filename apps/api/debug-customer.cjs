const { PrismaClient } = require('@wowcado/database');
const p = new PrismaClient();

async function main() {
  try {
    const r = await p.customer.create({
      data: {
        customerNumber: 'TEST-DBG-' + Date.now(),
        name: 'Debug Customer',
        phone: '9999999990',
        email: 'debug@test.com',
        status: 'ACTIVE',
      }
    });
    console.log('SUCCESS:', JSON.stringify(r, null, 2));
  } catch (e) {
    console.error('PRISMA ERROR CODE:', e.code);
    console.error('PRISMA ERROR MSG:', e.message);
    console.error('PRISMA META:', JSON.stringify(e.meta, null, 2));
  } finally {
    await p.$disconnect();
  }
}
main();
