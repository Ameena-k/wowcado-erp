import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@wowcado/database';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async findAll(search?: string, status?: string, customerId?: string) {
    const where: any = {};
    if (status) where.status = status as OrderStatus;
    if (customerId) where.customerId = customerId;

    if (search) {
       where.OR = [
         { orderNumber: { contains: search, mode: 'insensitive' } },
         { customer: { name: { contains: search, mode: 'insensitive' } } }
       ];
    }

    const [data, total] = await Promise.all([
      this.db.client.order.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.db.client.order.count({ where })
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const order = await this.db.client.order.findUnique({
      where: { id },
      include: {
        customer: true,
        customerAddress: true,
        deliveryZone: true,
        deliverySlot: true,
        orderItems: {
          include: { product: true }
        }
      }
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto) {
    const customer = await this.db.client.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    let deliveryCharge = 0;
    if (dto.overrideDeliveryCharge !== undefined && dto.overrideDeliveryCharge !== null) {
       deliveryCharge = dto.overrideDeliveryCharge;
    } else if (dto.deliveryZoneId) {
       const zone = await this.db.client.deliveryZone.findUnique({ where: { id: dto.deliveryZoneId } });
       if (zone) deliveryCharge = Number(zone.deliveryCharge);
    }

    const productIds = dto.items.map(i => i.productId);
    const products = await this.db.client.product.findMany({
      where: { id: { in: productIds } },
      include: { taxRate: true }
    });

    if (products.length !== productIds.length) {
       throw new BadRequestException('One or more products missing from catalog');
    }
    
    const productMap = new Map(products.map(p => [p.id, p]));

    let subtotal = 0;
    let taxTotal = 0;

    const orderItems = dto.items.map(item => {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} not found in catalog`);
      const unitPrice = Number(product.sellingPrice);
      const taxRate = Number((product as any).taxRate?.rate ?? 0);
      
      const lineTotalExclTax = unitPrice * item.quantity;
      const taxAmount = lineTotalExclTax * (taxRate / 100);
      const lineTotal = lineTotalExclTax + taxAmount;

      subtotal += lineTotalExclTax;
      taxTotal += taxAmount;

      return {
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: (product as any).sku,
        quantity: item.quantity,
        unitPrice,
        taxableLineAmount: lineTotalExclTax,
        taxRateSnapshot: taxRate,
        taxAmount,
        lineTotal,
      };
    });

    if (dto.taxOnDelivery && deliveryCharge > 0) {
      const deliveryTax = deliveryCharge * 0.18; // 18% generic standard limit internally mapped
      taxTotal += deliveryTax;
    }

    const grandTotal = subtotal + taxTotal + deliveryCharge;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    return this.db.client.order.create({
      data: {
        orderNumber,
        customerId: dto.customerId,
        customerAddressId: dto.customerAddressId,
        deliveryZoneId: dto.deliveryZoneId || null,
        deliverySlotId: dto.deliverySlotId || null,
        orderDate: new Date(dto.orderDate),
        deliveryDate: new Date(dto.deliveryDate),
        status: 'DRAFT', 
        paymentStatus: 'UNPAID',
        subtotal,
        orderDiscountAmount: 0,
        taxableAmount: subtotal,
        deliveryCharge,
        taxTotal,
        grandTotal,
        taxOnDelivery: dto.taxOnDelivery ?? false,
        notes: dto.notes,
        orderItems: {
           create: orderItems
        }
      } as any 
    });
  }

  async updateStatus(id: string, newStatus: OrderStatus) {
    const updated = await this.db.client.order.update({
      where: { id },
      data: { status: newStatus }
    });

    if (newStatus === 'CONFIRMED' || newStatus === 'PLACED') {
       // Fire and forget so we don't throw HTTP errors upstream to caller if WA fails
       this.whatsapp.sendOrderConfirmation(id).catch(err => {
         console.error(`[Whatsapp Hook Failure - Order ${id}]:`, err.message);
       });
    }

    return updated;
  }
}
