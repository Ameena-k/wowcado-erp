import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private db: DatabaseService) {}

  async getSummary() {
    const [
      totalSalesResult,
      totalCollectionsResult,
      outstandingReceivablesResult,
      outstandingPayablesResult,
      totalExpensesResult,
      invoicesIssuedTotal,
      invoicesPaidTotal,
      invoicesUnpaidTotal,
    ] = await Promise.all([
      // Total Sales
      this.db.client.invoice.aggregate({ _sum: { subtotal: true } }),
      
      // Total Collections
      this.db.client.customerPayment.aggregate({ 
          where: { status: 'COMPLETED' },
          _sum: { amount: true } 
      }),
      
      // Outstanding Receivables
      this.db.client.invoice.aggregate({ 
          where: { balanceDue: { gt: 0 } },
          _sum: { balanceDue: true } 
      }),

      // Outstanding Payables
      this.db.client.supplierBill.aggregate({ 
          where: { balanceDue: { gt: 0 } },
          _sum: { balanceDue: true } 
      }),

      // Total Expenses
      this.db.client.expense.aggregate({ _sum: { amount: true } }),

      // Invoice Counts
      this.db.client.invoice.count(),
      this.db.client.invoice.count({ where: { status: 'PAID' } }),
      this.db.client.invoice.count({ where: { status: { in: ['ISSUED', 'PARTIALLY_PAID'] } } }),
    ]);

    // Recent Transactions Snapshot
    const recentTransactions = await this.db.client.$queryRawUnsafe(`
      SELECT 'INVOICE' as type, id as "refId", "invoiceNumber" as "refNumber", "invoiceDate" as "entryDate", "grandTotal" as amount, status::text
      FROM "Invoice"
      UNION ALL
      SELECT 'CUSTOMER_PAYMENT' as type, id as "refId", "paymentNumber" as "refNumber", "paymentDate" as "entryDate", amount, status::text
      FROM "CustomerPayment"
      UNION ALL
      SELECT 'EXPENSE' as type, id as "refId", "expenseNumber" as "refNumber", "expenseDate" as "entryDate", amount, status::text
      FROM "Expense"
      UNION ALL
      SELECT 'SUPPLIER_BILL' as type, id as "refId", "billNumber" as "refNumber", "billDate" as "entryDate", "grandTotal" as amount, status::text
      FROM "SupplierBill"
      UNION ALL
      SELECT 'VENDOR_PAYMENT' as type, id as "refId", "paymentNumber" as "refNumber", "paymentDate" as "entryDate", amount, status::text
      FROM "VendorPayment"
      ORDER BY "entryDate" DESC
      LIMIT 10
    `);

    return {
      metrics: {
        totalSales: totalSalesResult._sum.subtotal || 0,
        totalCollections: totalCollectionsResult._sum.amount || 0,
        outstandingReceivables: outstandingReceivablesResult._sum.balanceDue || 0,
        outstandingPayables: outstandingPayablesResult._sum.balanceDue || 0,
        totalExpenses: totalExpensesResult._sum.amount || 0,
        invoiceCount: {
          total: invoicesIssuedTotal,
          paid: invoicesPaidTotal,
          unpaidOrPartial: invoicesUnpaidTotal,
        }
      },
      recentTransactions
    };
  }
}
