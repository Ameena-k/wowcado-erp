import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PostingEngineService } from '../posting-engine/posting-engine.service';
import { randomBytes } from 'crypto';

@Injectable()
export class SupplierBillsService {
  constructor(
    private db: DatabaseService,
    private postingEngine: PostingEngineService
  ) {}

  async create(data: any) {
    const { items, ...billData } = data;

    let subtotal = 0;
    let taxTotal = 0;

    const mappedItems = (items || []).map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const lineSubtotal = qty * price;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      return { ...item, quantity: qty, unitPrice: price, taxRate, lineTotal };
    });

    const grandTotal = subtotal + taxTotal;

    const bill = await this.db.client.supplierBill.create({
      data: {
        ...billData,
        billNumber: `BILL-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`,
        billDate: billData.billDate ? new Date(billData.billDate) : new Date(),
        dueDate: billData.dueDate ? new Date(billData.dueDate) : null,
        subtotal,
        taxTotal,
        grandTotal,
        balanceDue: grandTotal,
        paidAmount: 0,
        status: billData.status || 'DRAFT',
        items: { create: mappedItems }
      },
      include: { items: true, vendor: true }
    });

    if (bill.status === 'ISSUED') {
      await this.postingEngine.postSupplierBill(bill.id);
    }
    return bill;
  }

  async findAll(search?: string, vendorId?: string, status?: string) {
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.client.supplierBill.findMany({
        where,
        include: { vendor: { select: { name: true } }, items: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.db.client.supplierBill.count({ where })
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const bill = await this.db.client.supplierBill.findUnique({
      where: { id },
      include: { vendor: true, items: true }
    });
    if (!bill) throw new NotFoundException('Supplier bill not found');
    return bill;
  }

  async updateStatus(id: string, status: any) {
    const bill = await this.db.client.supplierBill.update({
      where: { id },
      data: { status }
    });
    if (status === 'ISSUED') {
      await this.postingEngine.postSupplierBill(bill.id);
    }
    return bill;
  }
}
