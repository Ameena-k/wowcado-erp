import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { DatabaseService } from '../database/database.service';
import { InvoiceStatus } from '@wowcado/database';
import { randomBytes } from 'crypto';
import { PostingEngineService } from '../posting-engine/posting-engine.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly postingEngine: PostingEngineService,
    private readonly whatsapp: WhatsappService
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { items, ...invoiceData } = createInvoiceDto;

    const customer = await this.db.client.customer.findUnique({ where: { id: invoiceData.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    let subtotal = 0;
    let taxTotal = 0;

    const invoiceItemsData = items.map(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const taxableLine = lineSubtotal - (item.lineDiscountAmount || 0);
      const computedTax = (taxableLine * item.taxRateSnapshot) / 100;

      subtotal += lineSubtotal;
      taxTotal += computedTax;

      return {
        ...item,
        taxAmount: computedTax,
        lineTotal: taxableLine + computedTax
      };
    });

    const calculatedDiscount = invoiceItemsData.reduce((acc, curr) => acc + (curr.lineDiscountAmount || 0), 0);
    const grandTotal = subtotal - calculatedDiscount + taxTotal;
    const balanceDue = grandTotal - (invoiceData.paidAmount || 0);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

    const newInvoice = await this.db.client.invoice.create({
      data: {
        ...invoiceData,
        invoiceNumber,
        invoiceDate: new Date(),
        subtotal,
        discountTotal: calculatedDiscount,
        taxTotal,
        grandTotal,
        balanceDue,
        status: invoiceData.status || InvoiceStatus.DRAFT,
        invoiceItems: {
          create: invoiceItemsData
        }
      },
      include: { invoiceItems: true }
    });

    if (newInvoice.status === InvoiceStatus.ISSUED) {
      await this.postingEngine.postInvoice(newInvoice.id);
      this.whatsapp.sendInvoiceIssued(newInvoice.id).catch(e => console.error(`[WhatsApp Invoice] ${e.message}`));
    }

    return newInvoice;
  }

  async generateFromOrder(orderId: string) {
    const existing = await this.db.client.invoice.findFirst({
        where: { orderId, status: { not: 'CANCELLED' } }
    });
    if (existing) throw new ConflictException('An active invoice already legally maps explicitly toward this order!');

    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    });

    if (!order) throw new NotFoundException('Order not found');

    const mappedItems = order.orderItems.map((oi: any) => ({
      productId: oi.productId,
      productNameSnapshot: oi.productNameSnapshot,
      skuSnapshot: oi.skuSnapshot || '',
      quantity: oi.quantity,
      unitPrice: Number(oi.unitPrice),
      lineDiscountAmount: Number(oi.lineDiscountAmount),
      taxRateSnapshot: Number(oi.taxRateSnapshot),
      taxAmount: Number(oi.taxAmount),
    }));

    // Convert explicit Order-level delivery bounds correctly if needed conceptually
    
    const dto: CreateInvoiceDto = {
      customerId: order.customerId,
      orderId: order.id,
      status: InvoiceStatus.DRAFT, // Default correctly cleanly internally
      dueDate: undefined,
      notes: order.notes || undefined,
      items: mappedItems as any
    };

    return this.create(dto);
  }

  async findAll(search?: string, status?: string, customerId?: string) {
    const where: any = {};
    if (status) where.status = status as InvoiceStatus;
    if (customerId) where.customerId = customerId;

    if (search) {
       where.OR = [
         { invoiceNumber: { contains: search, mode: 'insensitive' } },
         { customer: { name: { contains: search, mode: 'insensitive' } } }
       ];
    }

    const [data, total] = await Promise.all([
       this.db.client.invoice.findMany({
         where,
         include: { customer: { select: { name: true, phone: true } } },
         orderBy: { createdAt: 'desc' }
       }),
       this.db.client.invoice.count({ where })
    ]);

    return { data, total };
  }

  findOne(id: string) {
    return this.db.client.invoice.findUnique({ 
      where: { id },
      include: { invoiceItems: true, customer: true, order: true }
    });
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const { items, paidAmount, ...rest } = updateInvoiceDto as any;
    
    // Explicit safety block handling balance computations
    if (paidAmount !== undefined) {
       const inv = await this.db.client.invoice.findUnique({ where: { id }});
       if (!inv) throw new NotFoundException();
       
       const balanceDue = Number(inv.grandTotal) - paidAmount;
       const updated = await this.db.client.invoice.update({
         where: { id },
         data: { ...rest, paidAmount, balanceDue }
       });
       if (updated.status === InvoiceStatus.ISSUED) {
           await this.postingEngine.postInvoice(updated.id);
           this.whatsapp.sendInvoiceIssued(updated.id).catch(e => console.error(`[WhatsApp Invoice] ${e.message}`));
       }
       return updated;
    }

    const updated = await this.db.client.invoice.update({
      where: { id },
      data: rest as any
    });

    if (updated.status === InvoiceStatus.ISSUED) {
        await this.postingEngine.postInvoice(updated.id);
        this.whatsapp.sendInvoiceIssued(updated.id).catch(e => console.error(`[WhatsApp Invoice] ${e.message}`));
    }
    return updated;
  }

  remove(id: string) {
    return this.db.client.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED }
    });
  }
}
