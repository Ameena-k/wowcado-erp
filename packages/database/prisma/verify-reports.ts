import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- VERIFYING REPORTS & DASHBOARD ---');
  
  // 1. Dashboard Metrics
  const [
    totalSales, totalCollections, outstandingAR, outstandingAP, totalExpenses,
    invoicesTotal, invoicesPaid, invoicesUnpaid
  ] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { subtotal: true } }),
    prisma.customerPayment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.invoice.aggregate({ where: { balanceDue: { gt: 0 } }, _sum: { balanceDue: true } }),
    prisma.supplierBill.aggregate({ where: { balanceDue: { gt: 0 } }, _sum: { balanceDue: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.invoice.count({ where: { status: { in: ['ISSUED', 'PARTIALLY_PAID'] } } }),
  ]);

  console.log('\n[Dashboard Metrics]');
  console.log('Total Sales:', totalSales._sum.subtotal);
  console.log('Total Collections:', totalCollections._sum.amount);
  console.log('Outstanding AR:', outstandingAR._sum.balanceDue);
  console.log('Outstanding AP:', outstandingAP._sum.balanceDue);
  console.log('Total Expenses:', totalExpenses._sum.amount);
  console.log('Invoices (Total/Paid/Unpaid):', invoicesTotal, invoicesPaid, invoicesUnpaid);

  // 2. DayBook Timeline
  const startDate = new Date('2000-01-01');
  const endDate = new Date('2099-12-31');
  
  try {
    const raw: any[] = await prisma.$queryRawUnsafe(`
      SELECT 'INVOICE' as type, id as "refId", "invoiceNumber" as "refNumber", "invoiceDate" as "entryDate", "grandTotal" as amount, status::text
      FROM "Invoice" WHERE "invoiceDate" >= $1 AND "invoiceDate" <= $2
      UNION ALL
      SELECT 'CUSTOMER_PAYMENT' as type, id as "refId", "paymentNumber" as "refNumber", "paymentDate" as "entryDate", amount, status::text
      FROM "CustomerPayment" WHERE "paymentDate" >= $1 AND "paymentDate" <= $2
      UNION ALL
      SELECT 'EXPENSE' as type, id as "refId", "expenseNumber" as "refNumber", "expenseDate" as "entryDate", amount, status::text
      FROM "Expense" WHERE "expenseDate" >= $1 AND "expenseDate" <= $2
      UNION ALL
      SELECT 'SUPPLIER_BILL' as type, id as "refId", "billNumber" as "refNumber", "billDate" as "entryDate", "grandTotal" as amount, status::text
      FROM "SupplierBill" WHERE "billDate" >= $1 AND "billDate" <= $2
      UNION ALL
      SELECT 'VENDOR_PAYMENT' as type, id as "refId", "paymentNumber" as "refNumber", "paymentDate" as "entryDate", amount, status::text
      FROM "VendorPayment" WHERE "paymentDate" >= $1 AND "paymentDate" <= $2
      UNION ALL
      SELECT 'JOURNAL_ENTRY' as type, id as "refId", "journalNumber" as "refNumber", "entryDate" as "entryDate", 0 as amount, status::text
      FROM "JournalEntry" WHERE "entryDate" >= $1 AND "entryDate" <= $2
      ORDER BY "entryDate" DESC
      LIMIT 5
    `, startDate, endDate);

    console.log('\n[Day Book Query]');
    console.log(`Successfully fetched ${raw.length} mixed timeline events!`);
    if(raw.length > 0) {
      console.log('Sample event:', raw[0]);
    }
  } catch (err: any) {
    console.log('\n[Day Book ERROR]:', err.message);
  }

  // 3. Customer Outstanding
  try {
    const custOut = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: { balanceDue: { gt: 0 } },
      _sum: { balanceDue: true, grandTotal: true },
      _count: { id: true }
    });
    console.log('\n[Customer Outstanding]');
    console.log(`Found ${custOut.length} customers with outstanding tracking!`);
  } catch (err: any) {
    console.error(err);
  }

  // 4. Vendor Payable
  try {
    const venPay = await prisma.supplierBill.groupBy({
      by: ['vendorId'],
      where: { balanceDue: { gt: 0 } },
      _sum: { balanceDue: true, grandTotal: true },
      _count: { id: true }
    });
    console.log('\n[Vendor Payable]');
    console.log(`Found ${venPay.length} vendors with payables tracking!`);
  } catch (err: any) {
    console.error(err);
  }

  // 5. Ledger checks (Accounts Payable)
  try {
    const apAccount = await prisma.account.findUnique({ where: { code: '2010' } });
    if (apAccount) {
      const apLines = await prisma.journalEntryLine.findMany({ where: { accountId: apAccount.id } });
      const totalDebits = apLines.reduce((s, line) => s + Number(line.debitAmount), 0);
      const totalCredits = apLines.reduce((s, line) => s + Number(line.creditAmount), 0);
      console.log('\n[Ledger Checks (2010)]');
      console.log(`Total Debits: ${totalDebits}, Total Credits: ${totalCredits}, Net: ${totalCredits - totalDebits}`);
    }
  } catch (err: any) {
    console.error(err);
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
}

verify().finally(() => prisma.$disconnect());
