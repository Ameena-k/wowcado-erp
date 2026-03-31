import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PostingEngineService {
  constructor(private readonly db: DatabaseService) {}

  async postInvoice(invoiceId: string) {
    const invoice = await this.db.client.invoice.findUnique({
      where: { id: invoiceId },
      include: { invoiceItems: { include: { product: true } } }
    });

    if (!invoice) throw new BadRequestException('Invoice not found');

    // Prevent duplicate entries
    const existing = await this.db.client.journalEntry.findUnique({
      where: { sourceType_sourceId: { sourceType: 'INVOICE', sourceId: invoiceId } }
    });
    if (existing) return existing; // Idempotent

    // Credit logic
    const arAccount = await this.db.client.account.findUnique({ where: { code: '1020' } }); // Accounts Receivable
    const salesAccount = await this.db.client.account.findUnique({ where: { code: '4000' } }); // Sales
    const taxAccount = await this.db.client.account.findUnique({ where: { code: '2000' } }); // Tax Payable

    if (!arAccount || !salesAccount || !taxAccount) {
      throw new InternalServerErrorException('Critical system accounts missing for posting');
    }

    const lines = [];
    
    const effectiveSales = Number(invoice.grandTotal) - Number(invoice.taxTotal);
    
    // Debit AR
    if (Number(invoice.grandTotal) > 0) {
      lines.push({ accountId: arAccount.id, debitAmount: invoice.grandTotal, creditAmount: 0 });
    }

    // Credit Sales dynamically mapped by Product
    const salesCreditMap = new Map<string, number>();
    let remainingSales = effectiveSales;

    for (const item of invoice.invoiceItems) {
      const rawLineSales = Number(item.lineTotal) - Number(item.taxAmount);
      if (rawLineSales <= 0) continue;

      const targetAccountId = item.product?.salesAccountId || salesAccount.id;
      const current = salesCreditMap.get(targetAccountId) || 0;
      salesCreditMap.set(targetAccountId, current + rawLineSales);
      remainingSales -= rawLineSales;
    }

    // Fallback any remaining unmapped delta (e.g. shipping/freight minus its tax if any, since invoice level tax can obscure) to the Default Sales Account
    if (Math.abs(remainingSales) > 0.01) {
       const currentPrimary = salesCreditMap.get(salesAccount.id) || 0;
       salesCreditMap.set(salesAccount.id, currentPrimary + remainingSales);
    }

    for (const [accId, amt] of salesCreditMap.entries()) {
      if (amt > 0) {
        lines.push({ accountId: accId, debitAmount: 0, creditAmount: amt });
      }
    }

    // Credit Tax Payable
    if (Number(invoice.taxTotal) > 0) {
      lines.push({ accountId: taxAccount.id, debitAmount: 0, creditAmount: invoice.taxTotal });
    }

    // Verify balance
    const totalDebits = lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
    const totalCredits = lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
       throw new BadRequestException(`Journal Entry Unbalanced: Debit ${totalDebits} vs Credit ${totalCredits}`);
    }

    const journalNumber = `JRN-INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

    // Create entry
    return this.db.client.journalEntry.create({
      data: {
        journalNumber,
        entryDate: invoice.invoiceDate,
        sourceType: 'INVOICE',
        sourceId: invoiceId,
        memo: `Invoice Posting for ${invoice.invoiceNumber}`,
        lines: { create: lines }
      }
    });
  }

  async postCustomerPayment(paymentId: string) {
    const payment = await this.db.client.customerPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new BadRequestException('Payment not found');

    // Prevent duplicate entries
    const existing = await this.db.client.journalEntry.findUnique({
      where: { sourceType_sourceId: { sourceType: 'CUSTOMER_PAYMENT', sourceId: paymentId } }
    });
    if (existing) return existing; // Idempotent

    const arAccount = await this.db.client.account.findUnique({ where: { code: '1020' } }); // Accounts Receivable
    
    let cashAccountCode = '1010'; // Default Bank
    if (payment.paymentMethod === 'CASH') cashAccountCode = '1000';
    else if (payment.paymentMethod === 'RAZORPAY') cashAccountCode = '1030';
    
    const cashAccount = await this.db.client.account.findUnique({ where: { code: cashAccountCode } });

    if (!arAccount || !cashAccount) {
      throw new InternalServerErrorException('Critical system accounts missing for posting');
    }

    const lines = [];
    
    // Debit Cash/Bank
    if (Number(payment.amount) > 0) {
      lines.push({ accountId: cashAccount.id, debitAmount: payment.amount, creditAmount: 0 });
    }

    // Credit AR
    if (Number(payment.amount) > 0) {
      lines.push({ accountId: arAccount.id, debitAmount: 0, creditAmount: payment.amount });
    }

    const totalDebits = lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
    const totalCredits = lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
       throw new BadRequestException(`Journal Entry Unbalanced: Debit ${totalDebits} vs Credit ${totalCredits}`);
    }

    const journalNumber = `JRN-PAY-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

    return this.db.client.journalEntry.create({
      data: {
        journalNumber,
        entryDate: payment.paymentDate,
        sourceType: 'CUSTOMER_PAYMENT',
        sourceId: paymentId,
        memo: `Payment Posting for ${payment.paymentNumber}`,
        lines: { create: lines }
      }
    });
  }

  async postExpense(expenseId: string) {
    const expense = await this.db.client.expense.findUnique({
      where: { id: expenseId },
      include: { category: true }
    });

    if (!expense) throw new BadRequestException('Expense not found');

    const existing = await this.db.client.journalEntry.findUnique({
      where: { sourceType_sourceId: { sourceType: 'EXPENSE', sourceId: expenseId } }
    });
    if (existing) return existing;

    const expenseAccount = await this.db.client.account.findUnique({ where: { code: expense.category.linkedAccountCode || '' } });
    if (!expenseAccount) throw new InternalServerErrorException('Expense account mapping missing');

    const lines = [];
    
    // Debit Expense
    if (Number(expense.amount) > 0) {
      lines.push({ accountId: expenseAccount.id, debitAmount: expense.amount, creditAmount: 0 });
    }

    if (expense.paidImmediately && expense.paymentAccountId) {
      // Credit Bank/Cash
      lines.push({ accountId: expense.paymentAccountId, debitAmount: 0, creditAmount: expense.amount });
    } else {
      // Credit AP
      const apAccount = await this.db.client.account.findUnique({ where: { code: '2010' } });
      if (!apAccount) throw new InternalServerErrorException('Accounts Payable missing');
      lines.push({ accountId: apAccount.id, debitAmount: 0, creditAmount: expense.amount });
    }

    const totalDebits = lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
    const totalCredits = lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
       throw new BadRequestException(`Journal unbalanced: DR ${totalDebits} vs CR ${totalCredits}`);
    }

    return this.db.client.journalEntry.create({
      data: {
        journalNumber: `JRN-EXP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
        entryDate: expense.expenseDate,
        sourceType: 'EXPENSE',
        sourceId: expenseId,
        memo: `Expense Posting for ${expense.expenseNumber}`,
        lines: { create: lines }
      }
    });
  }

  async postSupplierBill(billId: string) {
    const bill = await this.db.client.supplierBill.findUnique({
      where: { id: billId },
      include: { items: true }
    });

    if (!bill) throw new BadRequestException('Supplier bill not found');

    const existing = await this.db.client.journalEntry.findUnique({
      where: { sourceType_sourceId: { sourceType: 'SUPPLIER_BILL', sourceId: billId } }
    });
    if (existing) return existing;

    const apAccount = await this.db.client.account.findUnique({ where: { code: '2010' } });
    if (!apAccount) throw new InternalServerErrorException('Accounts Payable missing');

    const lines = [];

    // Combine identical debit accounts dynamically
    const debitMap = new Map<string, number>();
    for (const item of bill.items) {
      if (!item.expenseAccountId) continue;
      const current = debitMap.get(item.expenseAccountId) || 0;
      debitMap.set(item.expenseAccountId, current + Number(item.lineTotal));
    }

    let extractedDebits = 0;
    for (const [accId, amt] of debitMap.entries()) {
      if (amt > 0) {
        lines.push({ accountId: accId, debitAmount: amt, creditAmount: 0 });
        extractedDebits += amt;
      }
    }

    // Default unmapped difference directly into AP generic fallback if desired, but we explicitly require line mapping
    // at phase 1 or throw logic block. I'll dynamically map any unmapped balances as a warning limit
    if (Math.abs(extractedDebits - Number(bill.grandTotal)) > 0.01) {
       // Since the prompt requires bill items to have expense_account_id mapped manually
       // if they miss mapping, the journal will unbalance. Let's fix missing subsets:
       throw new BadRequestException(`Supplier Bill missing explicit Expense Account mappings. Debits=${extractedDebits}, GrandTotal=${bill.grandTotal}`);
    }

    // Credit AP
    lines.push({ accountId: apAccount.id, debitAmount: 0, creditAmount: bill.grandTotal });
    
    // total check already implicitly mapped by extraction lock

    return this.db.client.journalEntry.create({
      data: {
        journalNumber: `JRN-BILL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
        entryDate: bill.billDate,
        sourceType: 'SUPPLIER_BILL',
        sourceId: billId,
        memo: `Bill Posting for ${bill.billNumber}`,
        lines: { create: lines }
      }
    });
  }

  async postVendorPayment(paymentId: string) {
    const payment = await this.db.client.vendorPayment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) throw new BadRequestException('Vendor payment not found');

    const existing = await this.db.client.journalEntry.findUnique({
      where: { sourceType_sourceId: { sourceType: 'VENDOR_PAYMENT', sourceId: paymentId } }
    });
    if (existing) return existing;

    const apAccount = await this.db.client.account.findUnique({ where: { code: '2010' } });
    
    let cashAccountCode = '1010'; // Default Bank
    if (payment.paymentMethod === 'CASH') cashAccountCode = '1000';
    else if (payment.paymentMethod === 'RAZORPAY') cashAccountCode = '1030';
    
    const cashAccount = await this.db.client.account.findUnique({ where: { code: cashAccountCode } });

    if (!apAccount || !cashAccount) {
      throw new InternalServerErrorException('Critical accounts missing');
    }

    const lines = [];

    // Debit AP
    if (Number(payment.amount) > 0) {
      lines.push({ accountId: apAccount.id, debitAmount: payment.amount, creditAmount: 0 });
    }

    // Credit Cash
    if (Number(payment.amount) > 0) {
      lines.push({ accountId: cashAccount.id, debitAmount: 0, creditAmount: payment.amount });
    }

    return this.db.client.journalEntry.create({
      data: {
        journalNumber: `JRN-VPAY-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
        entryDate: payment.paymentDate,
        sourceType: 'VENDOR_PAYMENT',
        sourceId: paymentId,
        memo: `Vendor Payment Posting for ${payment.paymentNumber}`,
        lines: { create: lines }
      }
    });
  }
}
