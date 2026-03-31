import { Controller, Post, Get, Param, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { DatabaseService } from '../database/database.service';
import { Roles } from '../auth/roles.decorator';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * GET /whatsapp/logs
   * Returns message log for admin inspection. Filter by status, type, or customer.
   */
  @Get('logs')
  @Roles('ADMIN', 'ACCOUNTANT')
  async getLogs(
    @Query('status') status?: string,
    @Query('linkedEntityType') linkedEntityType?: string,
    @Query('linkedEntityId') linkedEntityId?: string,
    @Query('customerId') customerId?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (linkedEntityType) where.linkedEntityType = linkedEntityType;
    if (linkedEntityId) where.linkedEntityId = linkedEntityId;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.db.client.whatsappMessageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { customer: { select: { name: true, phone: true } } }
      }),
      this.db.client.whatsappMessageLog.count({ where })
    ]);

    return { data, total };
  }

  /**
   * POST /whatsapp/remind/invoice/:invoiceId
   * Manually trigger a payment reminder for an outstanding invoice.
   */
  @Post('remind/invoice/:invoiceId')
  @Roles('ADMIN', 'ACCOUNTANT')
  async sendReminder(@Param('invoiceId') invoiceId: string) {
    const result = await this.whatsapp.sendPaymentReminder(invoiceId);
    return result ?? { message: 'Invoice is already paid or not found' };
  }

  /**
   * POST /whatsapp/notify/invoice/:invoiceId
   * Manually trigger an invoice issued notification.
   */
  @Post('notify/invoice/:invoiceId')
  @Roles('ADMIN', 'ACCOUNTANT')
  async sendInvoiceNotification(@Param('invoiceId') invoiceId: string) {
    const result = await this.whatsapp.sendInvoiceIssued(invoiceId);
    return result ?? { message: 'Invoice not found or missing customer details' };
  }

  /**
   * POST /whatsapp/notify/order/:orderId
   * Manually trigger an order confirmation notification.
   */
  @Post('notify/order/:orderId')
  @Roles('ADMIN', 'ACCOUNTANT', 'OPERATIONS')
  async sendOrderNotification(@Param('orderId') orderId: string) {
    const result = await this.whatsapp.sendOrderConfirmation(orderId);
    return result ?? { message: 'Order not found or missing customer details' };
  }
}
