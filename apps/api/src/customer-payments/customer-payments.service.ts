import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto';
import { UpdateCustomerPaymentDto } from './dto/update-customer-payment.dto';
import { DatabaseService } from '../database/database.service';
import { PaymentAllocationsService } from '../payment-allocations/payment-allocations.service';
import { PostingEngineService } from '../posting-engine/posting-engine.service';
import { PaymentStatus, PaymentMethod } from '@wowcado/database';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CustomerPaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly allocations: PaymentAllocationsService,
    private readonly postingEngine: PostingEngineService,
    private readonly whatsapp: WhatsappService
  ) {}

  async create(dto: CreateCustomerPaymentDto) {
    const { allocations, ...paymentData } = dto;

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${uuidv4().split('-')[0].toUpperCase()}`;

    const customer = await this.db.client.customer.findUnique({ where: { id: paymentData.customerId }});
    if (!customer) throw new NotFoundException('Customer not found');

    const amountNum = Number(paymentData.amount);

    const payment = await this.db.client.customerPayment.create({
      data: {
        ...paymentData,
        amount: amountNum,
        paymentDate: new Date(paymentData.paymentDate),
        paymentNumber,
        allocatedAmount: 0,
        unallocatedAmount: amountNum,
        status: paymentData.status || PaymentStatus.COMPLETED
      } as any
    });

    if (allocations && allocations.length > 0) {
      const totalAllocated = allocations.reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);
      if (totalAllocated > amountNum) {
        throw new BadRequestException('Total requested allocations exceed payment amount dynamically natively.');
      }

      for (const alloc of allocations) {
        await this.allocations.create(payment.id, alloc);
      }
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      await this.postingEngine.postCustomerPayment(payment.id);
      this.whatsapp.sendPaymentReceipt(payment.id).catch(e => console.error(`[WhatsApp Payment] ${e.message}`));
    }

    return this.db.client.customerPayment.findUnique({
      where: { id: payment.id },
      include: { allocations: true }
    });
  }

  // --- Razorpay Skeleton ---
  async createRazorpayOrder(amount: number, receiptId: string) {
    const razorpayOrderId = `order_skeleton_${uuidv4().replace(/-/g, '')}`;
    return { id: razorpayOrderId, amount: amount * 100, currency: "INR", receipt: receiptId, status: "created" };
  }

  async verifyRazorpaySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
    const text = orderId + "|" + paymentId;
    const generated_signature = crypto.createHmac("sha256", secret).update(text.toString()).digest("hex");
    return generated_signature === signature;
  }

  async handleRazorpayWebhook(payload: any) {
    console.log("Razorpay webhook received", payload);
    return { received: true };
  }
  // -------------------------

  async findAll(search?: string, customerId?: string, status?: string, method?: string) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status as PaymentStatus;
    if (method) where.paymentMethod = method as PaymentMethod;

    if (search) {
       where.OR = [
         { paymentNumber: { contains: search, mode: 'insensitive' } },
         { referenceNumber: { contains: search, mode: 'insensitive' } },
         { customer: { name: { contains: search, mode: 'insensitive' } } }
       ];
    }

    const [data, total] = await Promise.all([
      this.db.client.customerPayment.findMany({
        where,
        include: { customer: { select: { name: true, phone: true } }, allocations: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.db.client.customerPayment.count({ where })
    ]);
    return { data, total };
  }

  findOne(id: string) {
    return this.db.client.customerPayment.findUnique({ 
      where: { id },
      include: { 
         customer: true, 
         allocations: { include: { invoice: true } } 
      }
    });
  }

  update(id: string, updateDto: UpdateCustomerPaymentDto) {
    const { allocations, ...rest } = updateDto as any;
    return this.db.client.customerPayment.update({
      where: { id },
      data: rest as any
    });
  }

  remove(id: string) {
    return this.db.client.customerPayment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED }
    });
  }
}
