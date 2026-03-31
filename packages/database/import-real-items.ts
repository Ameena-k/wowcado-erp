import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function generateSku(name: string): string {
  // E.g., "Fuerte Small (125g - 150g)" -> "FUERTE-SMALL-125G-150G"
  return name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toUpperCase();
}

function parseCurrency(str: string): number {
  // "INR 75.00" -> 75.00
  if (!str) return 0;
  return Number(str.replace(/[^0-9.]/g, ''));
}

async function main() {
  console.log('📦 Starting Wowcado Real Product Import...');

  // 1. Explicitly Archive Demo Product PROD-001 just in case
  console.log('1. Archiving Dummy Product PROD-001...');
  try {
    await prisma.product.update({
      where: { sku: 'PROD-001' },
      data: { active: false }
    });
  } catch(e) { /* might not exist yet */ }

  // 2. Setup Category and Tax Rate
  const mainCategory = await prisma.category.upsert({
    where: { name: 'Catalog' },
    update: {},
    create: { name: 'Catalog', description: 'Primary Wowcado Inventory' }
  });

  let taxRate = await prisma.taxRate.findUnique({ where: { name: 'GST 18%' } });
  if (!taxRate) {
     taxRate = await prisma.taxRate.create({ data: { name: 'GST 18%', rate: 18.0 } });
  }

  // 3. Read CSV File
  const csvPath = path.join(__dirname, 'items.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: packages/database/items.csv not found!');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
  
  // Skip Header
  const rows = lines.slice(1);
  console.log(`2. Parsing ${rows.length} CSV rows...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    // Basic comma split works here because the user's data does not contain quoted commas.
    const [itemName, rateStr, accountName, status, unitName, purchaseAccountName] = row.split(',').map(s => s.trim());
    if (!itemName) continue;

    // Process Accounts dynamically
    const salesAccount = await prisma.account.findFirst({ where: { name: accountName } });
    if (!salesAccount) {
      console.warn(`⚠️ Warning: Revenue Account '${accountName}' missing. Skipping product ${itemName}.`);
      continue;
    }

    const purchaseAccount = await prisma.account.findFirst({ where: { name: purchaseAccountName } });
    if (!purchaseAccount) {
        console.warn(`⚠️ Warning: COGS Account '${purchaseAccountName}' missing. Skipping product ${itemName}.`);
        continue;
    }

    const price = parseCurrency(rateStr);
    const sku = generateSku(itemName);
    const activeStatus = status.toLowerCase() === 'active';

    const existingProduct = await prisma.product.findUnique({ where: { sku } });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: itemName,
          unit: unitName || 'Pieces',
          sellingPrice: price,
          salesAccountId: salesAccount.id,
          purchaseAccountId: purchaseAccount.id,
          active: activeStatus,
          categoryId: mainCategory.id,
          taxRateId: taxRate.id
        }
      });
      updatedCount++;
    } else {
      await prisma.product.create({
        data: {
          sku: sku,
          name: itemName,
          unit: unitName || 'Pieces',
          sellingPrice: price,
          salesAccountId: salesAccount.id,
          purchaseAccountId: purchaseAccount.id,
          active: activeStatus,
          categoryId: mainCategory.id,
          taxRateId: taxRate.id
        }
      });
      createdCount++;
    }
  }

  console.log('✅ Import Core Execution Completed!');
  console.log(`   - New Products Created: ${createdCount}`);
  console.log(`   - Existing Products Updated: ${updatedCount}`);
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
