import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client/index.js');

const db = new PrismaClient();
const BASE = 'http://localhost:3001/api/v1';

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✅ ${label}: ${JSON.stringify(actual)}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    failed++;
  }
}

function checkTruthy(label, actual) {
  if (actual) {
    console.log(`  ✅ ${label}: ${JSON.stringify(actual)}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}: falsy - ${JSON.stringify(actual)}`);
    failed++;
  }
}

async function run() {
  const s = Date.now().toString();
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  Accounts Payable E2E Verification & Role Enforcement');
  console.log(`${'═'.repeat(60)}\n`);

  // 1. Authenticate to get JWT token (Testing Role Enforcement)
  console.log('CHECK 1: Auth & Login Endpoint');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@wowcado.com', password: 'wowcado123' })
  });
  check('Auth HTTP status', loginRes.status, 201);
  const loginData = await loginRes.json();
  checkTruthy('JWT Token received', loginData.access_token);
  
  const token = loginData.access_token;
  const headers = {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`
  };

  // 2. Seed Vendor, Account and Expense manually via Prisma for speed
  const vendor = await db.vendor.create({
    data: { name: `Test Vendor ${s}`, status: 'ACTIVE' }
  });
  
  const accExp = await db.account.upsert({
    where: { code: '6010' },
    update: {},
    create: { code: '6010', name: 'Office Expenses', type: 'EXPENSE' }
  });

  const accAp = await db.account.upsert({
    where: { code: '2010' },
    update: {},
    create: { code: '2010', name: 'Accounts Payable', type: 'LIABILITY' }
  });
  
  const expCat = await db.expenseCategory.create({
    data: { name: `Office Supplies ${s}`, linkedAccountCode: '6010' }
  });

  const expense = await db.expense.create({
    data: {
      expenseNumber: `EXP-E2E-${s}`,
      expenseDate: new Date(),
      expenseCategoryId: expCat.id,
      vendorId: vendor.id,
      amount: 4500,
      status: 'DRAFT'
    }
  });
  console.log(`\nSeeded Expense ${expense.id} with DRAFT status, amount=4500`);

  // 3. Test Role Enforcement & Journal Posting (Expenses -> PAID)
  console.log('\nCHECK 2: Post Expense (Trigger Ledger)');
  const expPatch = await fetch(`${BASE}/expenses/${expense.id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'PAID' })
  });
  
  check('Post Expense HTTP Status (Should 200 or 403 based on role, admin should 200/201)', expPatch.status, 200) || check('Post Expense HTTP Status (alt)', expPatch.status, 201); // fallback check

  // Read Expense from DB
  const expUpdated = await db.expense.findUnique({ where: { id: expense.id }});
  check('Expense Status updated', expUpdated.status, 'PAID');

  // Verify Journal Postings
  console.log('\nCHECK 3: AP Ledger Verification');
  const journals = await db.journalEntry.findMany({
      where: { sourceId: expense.id, sourceType: 'EXPENSE' },
      include: { lines: true }
  });
  check('1 Journal Entry Created', journals.length, 1);
  if (journals.length > 0) {
      check('Journal Status PROCESSED', journals[0].status, 'POSTED');
      check('Journal has 2 lines (Double Entry)', journals[0].lines.length, 2);
  }

  // Verify Reports Endpoint Enforcement (Should Succeed with Admin JWT)
  console.log('\nCHECK 4: Reports Read Access (Role Guarded)');
  const reportRes = await fetch(`${BASE}/reports/journal-entries?page=1&limit=50`, {
     headers
  });
  // Should 200. Let's make sure it doesn't 403 or 401.
  check('Reports Endpoint HTTP Status (Admin)', reportRes.status, 200);

  // Unauthorised request test
  console.log('\nCHECK 5: Verify Unauthorized Access Rejection');
  const unauthRes = await fetch(`${BASE}/reports/journal-entries?page=1&limit=50`);
  check('Unauthorized request fails with 401', unauthRes.status, 401);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(60)}\n`);

  await db.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error('\n💥 Fatal error:', err.message);
  await db.$disconnect();
  process.exit(1);
});
