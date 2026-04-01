import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GST_CONSTANTS } from './gst.constants';

@Injectable()
export class GstService {
  constructor(private readonly db: DatabaseService) {}

  private getDateRange(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  async getDashboardSummary(month: number, year: number) {
    const { startDate, endDate } = this.getDateRange(month, year);
    
    // Total outward supplies (liability)
    const outward = await this.db.client.invoice.aggregate({
      where: {
        invoiceDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] }
      },
      _sum: {
        grandTotal: true,
        taxTotal: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
      }
    });

    // Total inward supplies (ITC)
    const inward = await this.db.client.supplierBill.aggregate({
      where: {
        billDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] }
      },
      _sum: {
        grandTotal: true,
        taxTotal: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
      }
    });

    return {
      period: { month, year },
      liability: outward._sum,
      itc: inward._sum,
      summary: {
        netTaxPayable: Number(outward._sum.taxTotal || 0) - Number(inward._sum.taxTotal || 0)
      }
    };
  }

  async getGstr1(month: number, year: number) {
    const { startDate, endDate } = this.getDateRange(month, year);
    
    const invoices = await this.db.client.invoice.findMany({
      where: {
        invoiceDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] }
      },
      include: {
        customer: true,
        invoiceItems: true,
      }
    });

    // Categorize into B2B and B2C
    const b2bInvoices = invoices.filter(inv => inv.customer.isGstRegistered && inv.customer.gstin);
    const b2cInvoices = invoices.filter(inv => !inv.customer.isGstRegistered || !inv.customer.gstin);

    return {
      period: { month, year },
      totalInvoices: invoices.length,
      b2b: {
        count: b2bInvoices.length,
        totalValue: b2bInvoices.reduce((acc, curr) => acc + Number(curr.grandTotal), 0),
        taxTotal: b2bInvoices.reduce((acc, curr) => acc + Number(curr.taxTotal), 0),
        documents: b2bInvoices
      },
      b2c: {
        count: b2cInvoices.length,
        totalValue: b2cInvoices.reduce((acc, curr) => acc + Number(curr.grandTotal), 0),
        taxTotal: b2cInvoices.reduce((acc, curr) => acc + Number(curr.taxTotal), 0),
        documents: b2cInvoices
      }
    };
  }

  async getGstr2b(month: number, year: number) {
    const { startDate, endDate } = this.getDateRange(month, year);
    
    const bills = await this.db.client.supplierBill.findMany({
      where: {
        billDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] }
      },
      include: {
        vendor: true,
        items: true,
      }
    });

    // To mimic Zoho GSTR-2B view showing matched vs unmatched transactions based on 2A sync.
    // Since we don't have GSTN integration, we just show all inward supplies claiming ITC.
    return {
      period: { month, year },
      totalTransactions: bills.length,
      matched: bills.length, // Simulated successful vendor reporting
      partiallyMatched: 0,
      totalItcAvailable: bills.reduce((acc, curr) => acc + Number(curr.taxTotal), 0),
      documents: bills
    };
  }

  async getGstr3b(month: number, year: number) {
     const summary = await this.getDashboardSummary(month, year);

     // GSTR-3B structure required for layout
     return {
       period: { month, year },
       table3_1: { // Outward and reverse charge inward supplies
         totalTaxableValue: summary.liability.grandTotal ? Number(summary.liability.grandTotal) - Number(summary.liability.taxTotal) : 0,
         igst: Number(summary.liability.igstTotal || 0),
         cgst: Number(summary.liability.cgstTotal || 0),
         sgst: Number(summary.liability.sgstTotal || 0),
         cess: 0
       },
       table4_a: { // ITC Available
         igst: Number(summary.itc.igstTotal || 0),
         cgst: Number(summary.itc.cgstTotal || 0),
         sgst: Number(summary.itc.sgstTotal || 0),
         cess: 0
       }
     };
  }
}
