import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreatePaymentAllocationDto } from './dto/create-payment-allocation.dto';
import { UpdatePaymentAllocationDto } from './dto/update-payment-allocation.dto';
import { DatabaseService } from '../database/database.service';
import { InvoiceStatus } from '@wowcado/database';

@Injectable()
export class PaymentAllocationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(paymentId: string, dto: CreatePaymentAllocationDto) {
    const payment = await this.db.client.customerPayment.findUnique({
      where: { id: paymentId }
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const invoice = await this.db.client.invoice.findUnique({
      where: { id: dto.invoiceId }
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (Number(dto.allocatedAmount) > Number(invoice.balanceDue)) {
      throw new BadRequestException('Cannot allocate more than invoice balance due');
    }

    if (Number(dto.allocatedAmount) > Number(payment.unallocatedAmount)) {
      throw new BadRequestException('Insufficient unallocated amount on payment');
    }

    const newPaymentAllocated = Number(payment.allocatedAmount) + Number(dto.allocatedAmount);
    const newPaymentUnallocated = Number(payment.amount) - newPaymentAllocated;

    if (newPaymentUnallocated < 0) {
      throw new BadRequestException('Unallocated amount cannot be negative');
    }

    const newInvoicePaidAmount = Number(invoice.paidAmount) + Number(dto.allocatedAmount);
    const newInvoiceBalanceDue = Number(invoice.grandTotal) - newInvoicePaidAmount;

    let newStatus = invoice.status;
    if (newInvoiceBalanceDue <= 0) {
      newStatus = InvoiceStatus.PAID;
    } else if (newInvoicePaidAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    return this.db.client.$transaction(async (tx: any) => {
      const allocation = await tx.paymentAllocation.create({
        data: {
          paymentId,
          invoiceId: dto.invoiceId,
          allocatedAmount: dto.allocatedAmount,
        }
      });

      await tx.customerPayment.update({
        where: { id: paymentId },
        data: {
          allocatedAmount: newPaymentAllocated,
          unallocatedAmount: newPaymentUnallocated
        }
      });

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: newInvoicePaidAmount,
          balanceDue: newInvoiceBalanceDue,
          status: newStatus
        }
      });

      return allocation;
    });
  }

  findAll() {
    return this.db.client.paymentAllocation.findMany();
  }

  findOne(id: string) {
    return this.db.client.paymentAllocation.findUnique({ where: { id }, include: { invoice: true, payment: true } });
  }

  update(id: string, updatePaymentAllocationDto: UpdatePaymentAllocationDto) {
    return this.db.client.paymentAllocation.update({
      where: { id },
      data: updatePaymentAllocationDto as any
    });
  }

  remove(id: string) {
    return this.db.client.paymentAllocation.delete({ where: { id } });
  }
}
