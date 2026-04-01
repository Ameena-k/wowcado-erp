import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importItems() {
  console.log('🚀 Starting CSV Import to Production Database');
  
  // 1. Ensure IGST 0% tax rate exists
  const taxRate = await prisma.taxRate.upsert({
    where: { name: 'IGST 0%' },
    update: {},
    create: { name: 'IGST 0%', rate: 0.0, isActive: true }
  });
  console.log(`✅ Default Tax Rate: ${taxRate.name} (${taxRate.rate}%)`);

  // 2. Ensure General Category exists
  const category = await prisma.category.upsert({
    where: { name: 'General' },
    update: {},
    create: { name: 'General', description: 'General Items' }
  });
  console.log(`✅ Default Category: ${category.name}`);

  // Fetch all accounts to map CSV 'Account' and 'Purchase Account' names to IDs
  const accounts = await prisma.account.findMany();
  const accountMap = accounts.reduce((acc, account) => {
    acc[account.name] = account.id;
    return acc;
  }, {} as Record<string, string>);

  if (!accountMap['Avocado Fruit Sales'] || !accountMap['Cost of Goods Sold']) {
    console.warn('⚠️ Warning: Expected Chart of Accounts not found. Using null for missing accounts.');
  }

  // 3. Read and parse the CSV
  const csvPath = path.join(__dirname, 'items.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  console.log(`Found ${dataLines.length} items to import...`);

  let imported = 0;
  for (let i = 0; i < dataLines.length; i++) {
    // Basic CSV splitting (assuming no commas inside quotes in this specific file)
    const line = dataLines[i];
    const parts = line.split(',');
    if (parts.length < 6) continue;

    const [itemName, rateStr, salesAccount, status, unitName, purchaseAccount] = parts;
    
    // Clean data
    const sellingPrice = parseFloat(rateStr.replace('INR ', '').trim());
    const isActive = status === 'Active';
    const sku = `ITEM-${String(i + 1).padStart(3, '0')}`;
    
    const salesAccountId = accountMap[salesAccount] || null;
    const purchaseAccountId = accountMap[purchaseAccount] || null;

    try {
      await prisma.product.upsert({
        where: { sku },
        update: {
          name: itemName,
          sellingPrice,
          active: isActive,
          unit: unitName,
          salesAccountId,
          purchaseAccountId,
          taxRateId: taxRate.id,
          categoryId: category.id
        },
        create: {
          sku,
          name: itemName,
          sellingPrice,
          active: isActive,
          unit: unitName,
          salesAccountId,
          purchaseAccountId,
          taxRateId: taxRate.id,
          categoryId: category.id
        }
      });
      imported++;
    } catch (err: any) {
      console.error(`❌ Failed to import "${itemName}": ${err.message}`);
    }
  }

  console.log(`✅ Successfully imported ${imported} items!`);
}

importItems()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
