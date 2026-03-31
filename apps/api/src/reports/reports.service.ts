import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private db: DatabaseService) {}

  async getSalesReport(query: ReportFilterDto) {
    const where: any = {};
    if (query.startDate && query.endDate) {
      where.orderDate = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.db.client.order.findMany({
        where,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit!,
        orderBy: { orderDate: 'desc' },
        include: { customer: true }
      }),
      this.db.client.order.count({ where })
    ]);

    const aggregations = await this.db.client.order.aggregate({
      where,
      _sum: { grandTotal: true, subtotal: true, taxTotal: true }
    });

    return { data, total, page: query.page, limit: query.limit, summary: aggregations._sum };
  }

  async getInvoiceReport(query: ReportFilterDto) {
    const where: any = {};
    if (query.startDate && query.endDate) {
      where.invoiceDate = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.db.client.invoice.findMany({
        where,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit!,
        orderBy: { invoiceDate: 'desc' },
        include: { customer: true }
      }),
      this.db.client.invoice.count({ where })
    ]);

    const aggregations = await this.db.client.invoice.aggregate({
      where,
      _sum: { grandTotal: true, balanceDue: true, paidAmount: true }
    });

    return { data, total, page: query.page, limit: query.limit, summary: aggregations._sum };
  }

  async getCollectionsReport(query: ReportFilterDto) {
    const where: any = {};
    if (query.startDate && query.endDate) {
      where.paymentDate = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.db.client.customerPayment.findMany({
        where,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit!,
        orderBy: { paymentDate: 'desc' },
        include: { customer: true }
      }),
      this.db.client.customerPayment.count({ where })
    ]);

    const aggregations = await this.db.client.customerPayment.aggregate({
      where,
      _sum: { amount: true, allocatedAmount: true }
    });

    return { data, total, page: query.page, limit: query.limit, summary: aggregations._sum };
  }

  async getCustomerOutstandingReport(query: ReportFilterDto) {
    const where: any = { balanceDue: { gt: 0 } };
    if (query.status) where.status = query.status;

    const data = await this.db.client.invoice.groupBy({
      by: ['customerId'],
      where,
      _sum: { balanceDue: true, grandTotal: true },
      _count: { id: true }
    });

    const customerIds = data.map(d => d.customerId);
    const customers = await this.db.client.customer.findMany({ where: { id: { in: customerIds } } });
    
    let totalOutstanding = 0;
    const finalData = data.map(d => {
      const cust = customers.find(c => c.id === d.customerId);
      totalOutstanding += Number(d._sum.balanceDue) || 0;
      return {
        customerId: d.customerId,
        customerName: cust?.name,
        invoiceCount: d._count.id,
        totalInvoiced: d._sum.grandTotal,
        balanceDue: d._sum.balanceDue
      };
    });

    const startIndex = (query.page! - 1) * query.limit!;
    const paginatedData = finalData.slice(startIndex, startIndex + query.limit!);

    return { data: paginatedData, total: finalData.length, page: query.page, limit: query.limit, summary: { totalOutstanding } };
  }

  async getVendorPayableReport(query: ReportFilterDto) {
    const where: any = { balanceDue: { gt: 0 } };
    if (query.status) where.status = query.status;

    const data = await this.db.client.supplierBill.groupBy({
      by: ['vendorId'],
      where,
      _sum: { balanceDue: true, grandTotal: true },
      _count: { id: true }
    });

    const vendorIds = data.map(d => d.vendorId);
    const vendors = await this.db.client.vendor.findMany({ where: { id: { in: vendorIds } } });
    
    let totalPayable = 0;
    const finalData = data.map(d => {
      const v = vendors.find(x => x.id === d.vendorId);
      totalPayable += Number(d._sum.balanceDue) || 0;
      return {
        vendorId: d.vendorId,
        vendorName: v?.name,
        billCount: d._count.id,
        totalBilled: d._sum.grandTotal,
        balanceDue: d._sum.balanceDue
      };
    });

    const startIndex = (query.page! - 1) * query.limit!;
    const paginatedData = finalData.slice(startIndex, startIndex + query.limit!);

    return { data: paginatedData, total: finalData.length, page: query.page, limit: query.limit, summary: { totalPayable } };
  }

  async getExpenseReport(query: ReportFilterDto) {
    const where: any = {};
    if (query.startDate && query.endDate) {
      where.expenseDate = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.db.client.expense.findMany({
        where,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit!,
        orderBy: { expenseDate: 'desc' },
        include: { category: true, vendor: true }
      }),
      this.db.client.expense.count({ where })
    ]);

    const aggregations = await this.db.client.expense.aggregate({
      where,
      _sum: { amount: true }
    });

    return { data, total, page: query.page, limit: query.limit, summary: aggregations._sum };
  }

  async getJournalEntriesReport(query: ReportFilterDto) {
    const where: any = {};
    if (query.startDate && query.endDate) {
      where.entryDate = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }

    const [data, total] = await Promise.all([
      this.db.client.journalEntry.findMany({
        where,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit!,
        orderBy: { entryDate: 'desc' },
        include: { lines: { include: { account: true } } }
      }),
      this.db.client.journalEntry.count({ where })
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async getLedgerByAccount(accountId: string, query: ReportFilterDto) {
    const where: any = { accountId };
    if (query.startDate && query.endDate) {
      where.journalEntry = { entryDate: { gte: new Date(query.startDate), lte: new Date(query.endDate) } };
    }

    const account = await this.db.client.account.findUnique({ where: { id: accountId } });
    if (!account) throw new BadRequestException('Account not found');

    const lines = await this.db.client.journalEntryLine.findMany({
      where,
      include: { journalEntry: true },
      orderBy: { journalEntry: { entryDate: 'asc' } }
    });

    let runningBalance = 0;
    let totalDebits = 0;
    let totalCredits = 0;

    const mapped = lines.map(line => {
      const dr = Number(line.debitAmount);
      const cr = Number(line.creditAmount);
      totalDebits += dr;
      totalCredits += cr;

      let netChange = 0;
      if (account.type === 'ASSET' || account.type === 'EXPENSE') netChange = dr - cr;
      else netChange = cr - dr;

      runningBalance += netChange;

      return {
        ...line,
        netChange,
        runningBalance
      };
    });

    return { data: mapped, account, summary: { totalDebits, totalCredits, endingBalance: runningBalance } };
  }

  async getDayBook(query: ReportFilterDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date('2000-01-01');
    const endDate = query.endDate ? new Date(query.endDate) : new Date('2099-12-31');
    const limit = query.limit || 50;
    const offset = ((query.page || 1) - 1) * limit;

    const raw = await this.db.client.$queryRawUnsafe(`
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
      LIMIT $3 OFFSET $4
    `, startDate, endDate, limit, offset);

    return { data: raw, page: query.page, limit: query.limit };
  }
}
