import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GST_CONSTANTS } from './gst.constants';

// Helper: round to 2 decimals
function r2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class GstService {
  constructor(private readonly db: DatabaseService) {}

  private getDateRange(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  // ─── GSTR-3B Full Summary ─────────────────────────────────────────────────

  async getGstr3b(month: number, year: number) {
    const { startDate, endDate } = this.getDateRange(month, year);

    // ── Section 3.1: Outward Supplies ──────────────────────────────────────
    const invoices = await this.db.client.invoice.findMany({
      where: {
        invoiceDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      include: {
        customer: true,
        invoiceItems: true,
      },
    });

    let outwardTaxableValue = 0;
    let outwardIgst = 0;
    let outwardCgst = 0;
    let outwardSgst = 0;
    let exemptSales = 0;

    for (const inv of invoices) {
      const customerState = inv.placeOfSupply || inv.customer.stateCode || GST_CONSTANTS.HOME_STATE_CODE;
      const isInterState = customerState !== GST_CONSTANTS.HOME_STATE_CODE;

      for (const item of inv.invoiceItems) {
        const rate = Number(item.taxRateSnapshot);
        const lineTotal = Number(item.lineTotal);
        const taxAmount = Number(item.taxAmount);
        // Taxable value = lineTotal - taxAmount (lineTotal is inclusive of tax in our model)
        // Actually in our schema: lineTotal = (qty * unitPrice - discount) + tax
        // So taxable = lineTotal - taxAmount
        const taxableValue = r2(lineTotal - taxAmount);

        if (rate === 0) {
          // Exempt / nil-rated
          exemptSales = r2(exemptSales + taxableValue);
        } else {
          // Taxable
          outwardTaxableValue = r2(outwardTaxableValue + taxableValue);
          if (isInterState) {
            outwardIgst = r2(outwardIgst + taxAmount);
          } else {
            outwardCgst = r2(outwardCgst + r2(taxAmount / 2));
            outwardSgst = r2(outwardSgst + r2(taxAmount / 2));
          }
        }
      }
    }

    // ── Section 3.1(d): Reverse Charge Supplies ────────────────────────────
    const rcBills = await this.db.client.supplierBill.findMany({
      where: {
        billDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        reverseCharge: true,
      },
      include: {
        vendor: true,
        items: true,
      },
    });

    let rcTaxableValue = 0;
    let rcIgst = 0;
    let rcCgst = 0;
    let rcSgst = 0;

    for (const bill of rcBills) {
      const vendorState = bill.placeOfSupply || bill.vendor.stateCode || GST_CONSTANTS.HOME_STATE_CODE;
      const isInterState = vendorState !== GST_CONSTANTS.HOME_STATE_CODE;

      for (const item of bill.items) {
        const rate = Number(item.taxRateSnapshot);
        const taxAmount = Number(item.taxAmount);
        const taxableValue = r2(Number(item.lineTotal) - taxAmount);

        if (rate > 0) {
          rcTaxableValue = r2(rcTaxableValue + taxableValue);
          if (isInterState) {
            rcIgst = r2(rcIgst + taxAmount);
          } else {
            rcCgst = r2(rcCgst + r2(taxAmount / 2));
            rcSgst = r2(rcSgst + r2(taxAmount / 2));
          }
        }
      }
    }

    // ── Section 4: ITC Available ───────────────────────────────────────────
    const itcBills = await this.db.client.supplierBill.findMany({
      where: {
        billDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        itcEligible: true,
      },
      include: {
        vendor: true,
        items: true,
      },
    });

    let itcIgst = 0;
    let itcCgst = 0;
    let itcSgst = 0;

    for (const bill of itcBills) {
      const vendorState = bill.placeOfSupply || bill.vendor.stateCode || GST_CONSTANTS.HOME_STATE_CODE;
      const isInterState = vendorState !== GST_CONSTANTS.HOME_STATE_CODE;

      for (const item of bill.items) {
        const rate = Number(item.taxRateSnapshot);
        const taxAmount = Number(item.taxAmount);

        if (rate > 0) {
          if (isInterState) {
            itcIgst = r2(itcIgst + taxAmount);
          } else {
            itcCgst = r2(itcCgst + r2(taxAmount / 2));
            itcSgst = r2(itcSgst + r2(taxAmount / 2));
          }
        }
      }
    }

    // ── Section 5: Exempt / Nil / Non-GST Purchases ───────────────────────
    const allBills = await this.db.client.supplierBill.findMany({
      where: {
        billDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      include: { items: true },
    });

    let exemptPurchases = 0;
    for (const bill of allBills) {
      for (const item of bill.items) {
        if (Number(item.taxRateSnapshot) === 0) {
          exemptPurchases = r2(exemptPurchases + r2(Number(item.lineTotal) - Number(item.taxAmount)));
        }
      }
    }

    // ── Net Tax Payable ───────────────────────────────────────────────────
    const totalLiabilityIgst = r2(outwardIgst + rcIgst);
    const totalLiabilityCgst = r2(outwardCgst + rcCgst);
    const totalLiabilitySgst = r2(outwardSgst + rcSgst);

    const netIgst = r2(totalLiabilityIgst - itcIgst);
    const netCgst = r2(totalLiabilityCgst - itcCgst);
    const netSgst = r2(totalLiabilitySgst - itcSgst);

    return {
      period: { month, year },
      companyGstin: GST_CONSTANTS.COMPANY_GSTIN,
      companyState: GST_CONSTANTS.HOME_STATE_CODE,

      // Section 3.1 — Outward taxable supplies (other than zero rated, nil rated and exempted)
      outwardSupplies: {
        taxableValue: outwardTaxableValue,
        igst: outwardIgst,
        cgst: outwardCgst,
        sgst: outwardSgst,
      },

      // Section 3.1(d) — Inward supplies liable to reverse charge
      reverseCharge: {
        taxableValue: rcTaxableValue,
        igst: rcIgst,
        cgst: rcCgst,
        sgst: rcSgst,
      },

      // Section 3.1(e) — Non-GST outward supplies / exempt
      exemptSupplies: exemptSales,

      // Section 4 — Eligible ITC
      itc: {
        igst: itcIgst,
        cgst: itcCgst,
        sgst: itcSgst,
      },

      // Section 5 — Values of exempt, nil rated and non-GST inward supplies
      exemptPurchases: exemptPurchases,

      // Net tax payable (after ITC set-off)
      netTaxPayable: {
        igst: Math.max(netIgst, 0),
        cgst: Math.max(netCgst, 0),
        sgst: Math.max(netSgst, 0),
        total: r2(Math.max(netIgst, 0) + Math.max(netCgst, 0) + Math.max(netSgst, 0)),
      },

      // Source metadata
      meta: {
        totalInvoices: invoices.length,
        totalBills: allBills.length,
        rcBillCount: rcBills.length,
        itcBillCount: itcBills.length,
      },
    };
  }

  // ─── Dashboard Summary (existing, kept for GST filing overview page) ────

  async getDashboardSummary(month: number, year: number) {
    const { startDate, endDate } = this.getDateRange(month, year);

    const outward = await this.db.client.invoice.aggregate({
      where: {
        invoiceDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      _sum: {
        grandTotal: true,
        taxTotal: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
      },
    });

    const inward = await this.db.client.supplierBill.aggregate({
      where: {
        billDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      _sum: {
        grandTotal: true,
        taxTotal: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
      },
    });

    return {
      period: { month, year },
      liability: outward._sum,
      itc: inward._sum,
      summary: {
        netTaxPayable:
          Number(outward._sum.taxTotal || 0) -
          Number(inward._sum.taxTotal || 0),
      },
    };
  }

  // ─── GSTR-1 (kept for overview page) ─────────────────────────────────────

  async getGstr1(month: number, year: number) {
    const { startDate, endDate } = this.getDateRange(month, year);

    const invoices = await this.db.client.invoice.findMany({
      where: {
        invoiceDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      include: {
        customer: true,
        invoiceItems: true,
      },
    });

    const b2bInvoices = invoices.filter(
      (inv) => inv.customer.isGstRegistered && inv.customer.gstin,
    );
    const b2cInvoices = invoices.filter(
      (inv) => !inv.customer.isGstRegistered || !inv.customer.gstin,
    );

    return {
      period: { month, year },
      totalInvoices: invoices.length,
      b2b: {
        count: b2bInvoices.length,
        totalValue: b2bInvoices.reduce(
          (acc, curr) => acc + Number(curr.grandTotal),
          0,
        ),
        taxTotal: b2bInvoices.reduce(
          (acc, curr) => acc + Number(curr.taxTotal),
          0,
        ),
        documents: b2bInvoices,
      },
      b2c: {
        count: b2cInvoices.length,
        totalValue: b2cInvoices.reduce(
          (acc, curr) => acc + Number(curr.grandTotal),
          0,
        ),
        taxTotal: b2cInvoices.reduce(
          (acc, curr) => acc + Number(curr.taxTotal),
          0,
        ),
        documents: b2cInvoices,
      },
    };
  }

  // ─── GSTR-2B (kept for overview page) ────────────────────────────────────

  async getGstr2b(month: number, year: number) {
    const { startDate, endDate } = this.getDateRange(month, year);

    const bills = await this.db.client.supplierBill.findMany({
      where: {
        billDate: { gte: startDate, lte: endDate },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      include: {
        vendor: true,
        items: true,
      },
    });

    return {
      period: { month, year },
      totalTransactions: bills.length,
      matched: bills.length,
      partiallyMatched: 0,
      totalItcAvailable: bills.reduce(
        (acc, curr) => acc + Number(curr.taxTotal),
        0,
      ),
      documents: bills,
    };
  }
}
