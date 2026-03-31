import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PostingEngineService } from '../posting-engine/posting-engine.service';
import { randomBytes } from 'crypto';

@Injectable()
export class VendorPaymentsService {
  constructor(
    private db: DatabaseService,
    private postingEngine: PostingEngineService
  ) {}

  async create(data: any) {
    const { allocations, ...paymentData } = data;

    let allocatedAmount = 0;
    if (allocations && Array.isArray(allocations)) {
      allocations.forEach((a: any) => allocatedAmount += Number(a.allocatedAmount));
    }
    const unallocatedAmount = Number(paymentData.amount) - allocatedAmount;
    if (unallocatedAmount < 0) throw new BadRequestException('Total allocations exceed payment amount');

    const payment = await this.db.client.vendorPayment.create({
      data: {
        ...paymentData,
        amount: Number(paymentData.amount),
        allocatedAmount,
        unallocatedAmount,
        paymentNumber: `VPAY-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`,
        paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
        status: paymentData.status || 'COMPLETED',
        allocations: allocations ? { create: allocations } : undefined
      },
      include: { allocations: true, vendor: true }
    });

    if (allocations && Array.isArray(allocations)) {
      for (const alloc of allocations) {
        const bill = await this.db.client.supplierBill.findUnique({ where: { id: alloc.supplierBillId } });
        if (bill) {
          const paid = Number(bill.paidAmount) + Number(alloc.allocatedAmount);
          const bal = Number(bill.grandTotal) - paid;
          await this.db.client.supplierBill.update({
            where: { id: bill.id },
            data: {
              paidAmount: paid,
              balanceDue: bal,
              status: bal <= 0 ? 'PAID' : 'PARTIALLY_PAID'
            }
          });
        }
      }
    }

    if (payment.status === 'COMPLETED') {
      await this.postingEngine.postVendorPayment(payment.id);
    }
    return payment;
  }

  async findAll(search?: string, vendorId?: string, status?: string) {
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.client.vendorPayment.findMany({
        where,
        include: { vendor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      this.db.client.vendorPayment.count({ where })
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const payment = await this.db.client.vendorPayment.findUnique({
      where: { id },
      include: {
        vendor: true,
        allocations: { include: { supplierBill: true } }
      }
    });
    if (!payment) throw new NotFoundException('Vendor payment not found');
    return payment;
  }

  async updateStatus(id: string, status: any) {
    const payment = await this.db.client.vendorPayment.update({
      where: { id },
      data: { status }
    });
    if (status === 'COMPLETED') {
      await this.postingEngine.postVendorPayment(payment.id);
    }
    return payment;
  }
}
