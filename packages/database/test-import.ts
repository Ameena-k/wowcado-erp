import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function run() {
  const societies = await db.society.findMany({ select: { id: true, name: true } });
  const normalize = (str: string) => str ? String(str).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const societyMap = societies.map(s => ({ id: s.id, norm: normalize(s.name) }));

  const rows = [
    // 1. Clean new customer
    { name: 'Alice Test', phone: '9999900001', email: 'alice@test.com', society: 'Palm Meadows', blockOrStreet: 'Block A', doorNo: '101', landmark: 'Near Gate' },
    // 2. Duplicate phone (should update Bob to Bob Updated)
    { name: 'Alice Updated', phone: '9999900001', email: 'alice.updated@test.com', society: 'Prestige Falcon City', blockOrStreet: 'Tower 2', doorNo: '505', landmark: '' },
    // 3. Unmatched/low-confidence society
    { name: 'Charlie Error', phone: '9999900003', email: '', society: 'Unknown Galaxy Apartments', blockOrStreet: 'Z', doorNo: '99', landmark: '' },
    // 4. Incomplete/invalid row (Missing phone)
    { name: 'Dave No Phone', phone: '', society: 'Palm Meadows', blockOrStreet: 'B', doorNo: '2' }
  ];

  const results = { created: 0, updated: 0, skipped: 0, reviewRequired: 0, failed: 0, details: [] as any[] };

  for (const row of rows) {
    if (!row.phone || !row.name) {
       results.skipped++;
       continue;
    }

    let phoneNorm = String(row.phone).replace(/\D/g, '');
    if (phoneNorm.length > 10 && phoneNorm.startsWith('91')) phoneNorm = phoneNorm.substring(2);

    const normSoc = normalize(row.society);
    const matchedSociety = societyMap.find(s => s.norm === normSoc || s.norm.includes(normSoc) || normSoc.includes(s.norm));
    
    if (!matchedSociety) {
       results.reviewRequired++;
       results.details.push({ row, reason: `Society '${row.society}' unmatched.`, status: 'REVIEW_REQUIRED' });
       continue;
    }

    try {
      const existing = await db.customer.findUnique({ where: { phone: phoneNorm } });
      
      if (existing) {
         await db.customer.update({
           where: { id: existing.id },
           data: { name: row.name, email: row.email }
         });
         
         const defaultAddr = await db.customerAddress.findFirst({ where: { customerId: existing.id, isDefault: true } });
         if (defaultAddr) {
            await db.customerAddress.update({
               where: { id: defaultAddr.id },
               data: { societyId: matchedSociety.id, blockOrStreet: String(row.blockOrStreet || ''), doorNo: String(row.doorNo || ''), landmark: String(row.landmark || '') }
            });
         }
         results.updated++;
      } else {
         await db.customer.create({
           data: {
             name: row.name, phone: phoneNorm, email: row.email || null,
             addresses: {
               create: {
                 recipientName: row.name, phone: phoneNorm, isDefault: true,
                 societyId: matchedSociety.id, blockOrStreet: String(row.blockOrStreet || ''), doorNo: String(row.doorNo || ''), landmark: String(row.landmark || '')
               }
             }
           }
         });
         results.created++;
      }
    } catch (err: any) {
       results.failed++;
       results.details.push({ row, reason: err.message, status: 'FAILED' });
    }
  }

  console.log("=== EXPORT CSV LOGIC ===");
  const customers = await db.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      addresses: {
        where: { isDefault: true },
        include: { society: true },
        take: 1
      }
    },
    take: 2 // Show just the 2 we touched
  });
  const headers = ['Customer Name', 'Phone', 'Email', 'Society/Apartment', 'Block/Street', 'Flat/Door No', 'Landmark', 'Status'];
  const exportRows = customers.map(c => {
    const addr = c.addresses[0];
    return [
      c.name, c.phone, c.email || '', 
      addr?.society?.name || '', addr?.blockOrStreet || '',
      addr?.doorNo || '', addr?.landmark || '', c.status
    ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',');
  });

  console.log("IMPORT RESULTS:", JSON.stringify(results, null, 2));
  console.log("\nEXPORT DATA:\n" + [headers.join(','), ...exportRows].join('\n'));
}

run().catch(console.error).finally(() => db.$disconnect());
