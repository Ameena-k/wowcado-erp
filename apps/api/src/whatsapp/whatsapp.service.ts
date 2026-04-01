import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { WhatsappMessageStatus } from '@wowcado/database';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiToken: string;
  private readonly phoneId: string;
  private readonly isTestMode: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {
    this.apiToken = this.config.get<string>('WHATSAPP_API_TOKEN', '');
    this.phoneId = this.config.get<string>('WHATSAPP_PHONE_ID', '');
    this.isTestMode = this.config.get<string>('WHATSAPP_TEST_MODE', 'true') === 'true';
    
    if (this.isTestMode || !this.apiToken || !this.phoneId) {
      this.logger.warn('WhatsApp service running in TEST/SIMULATED mode or missing credentials. Real messages will not be sent to Meta APIs.');
    }
  }

  /**
   * Core send utility mimicking Cloud API
   */
  async sendTemplateMessage({
    customerId,
    phone,
    templateName,
    linkedEntityType,
    linkedEntityId,
    variables
  }: {
    customerId?: string;
    phone: string;
    templateName: string;
    linkedEntityType?: string;
    linkedEntityId?: string;
    variables?: any;
  }) {
    // Basic format: ensure Indian code defaults if 10 digits without prefix
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`;
    }

    // Prepare Log Payload
    const logData = {
      customerId,
      phone: formattedPhone,
      templateName,
      linkedEntityType,
      linkedEntityId,
      payload: variables || {},
      status: WhatsappMessageStatus.QUEUED,
    };

    // Prevent explicit duplication if it concerns identical entities (unless it's a manual retry)
    if (linkedEntityId && linkedEntityType) {
       const existing = await this.db.client.whatsappMessageLog.findFirst({
         where: { linkedEntityId, linkedEntityType, templateName }
       });
       if (existing && existing.status === WhatsappMessageStatus.SENT) {
         this.logger.debug(`[WhatsApp] Skipping duplicate send for ${linkedEntityType} ${linkedEntityId}`);
         return existing;
       }
    }

    // Create Initial Queued Log
    let logRow = await this.db.client.whatsappMessageLog.create({ data: logData });

    // Execution
    if (this.isTestMode || !this.apiToken || !this.phoneId) {
      logRow = await this.db.client.whatsappMessageLog.update({
        where: { id: logRow.id },
        data: { status: WhatsappMessageStatus.SIMULATED }
      });
      this.logger.log(`[SIMULATED WhatsApp] -> To: +${formattedPhone} | Template: ${templateName} | Payload: ${JSON.stringify(variables)}`);
      return logRow;
    }

    try {
      const url = `https://graph.facebook.com/v17.0/${this.phoneId}/messages`;
      const components: any[] = [];
      if (variables && variables.bodyParameters) {
        components.push({
          type: 'body',
          parameters: variables.bodyParameters.map((text: string) => ({ type: 'text', text: String(text) }))
        });
      }
      
      if (variables && variables.buttonParameters && variables.buttonParameters.length > 0) {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: String(variables.buttonParameters[0])
            }
          ]
        });
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errBody: any = await response.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `HTTP ${response.status}`);
      }

      const responseData: any = await response.json();
      const providerMessageId = responseData?.messages?.[0]?.id;

      logRow = await this.db.client.whatsappMessageLog.update({
        where: { id: logRow.id },
        data: { status: WhatsappMessageStatus.SENT, providerMessageId }
      });
      
      this.logger.log(`[WhatsApp] Sent message ${providerMessageId} to +${formattedPhone} for ${linkedEntityType}`);
      return logRow;
    } catch (err: any) {
      const errorReason = err.response?.data?.error?.message || err.message || 'Unknown error';
      this.logger.error(`[WhatsApp] Failed to send message to +${formattedPhone}: ${errorReason}`);
      
      logRow = await this.db.client.whatsappMessageLog.update({
        where: { id: logRow.id },
        data: { status: WhatsappMessageStatus.FAILED, errorReason: errorReason.substring(0, 500) }
      });
      return logRow;
    }
  }

  // --- Wrapper Integration Methods ---

  async sendOrderConfirmation(orderId: string) {
    const order = await this.db.client.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });
    if (!order || !order.customer || !order.customer.phone) return;

    return this.sendTemplateMessage({
      customerId: order.customerId,
      phone: order.customer.phone,
      templateName: 'order_confirmation',
      linkedEntityType: 'ORDER',
      linkedEntityId: order.id,
      variables: {
        bodyParameters: [order.customer.name, order.orderNumber, Number(order.grandTotal).toString()]
      }
    });
  }

  async sendInvoiceIssued(invoiceId: string) {
    const invoice = await this.db.client.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });
    if (!invoice || !invoice.customer || !invoice.customer.phone) return;

    return this.sendTemplateMessage({
      customerId: invoice.customerId,
      phone: invoice.customer.phone,
      templateName: 'invoice_issued',
      linkedEntityType: 'INVOICE',
      linkedEntityId: invoice.id,
      variables: {
        bodyParameters: [
          invoice.customer.name,
          invoice.invoiceNumber,
          Number(invoice.grandTotal).toString()
        ],
        buttonParameters: [invoice.id]
      }
    });
  }

  async sendPaymentReceipt(paymentId: string) {
    const payment = await this.db.client.customerPayment.findUnique({
      where: { id: paymentId },
      include: { customer: true }
    });
    if (!payment || !payment.customer || !payment.customer.phone) return;

    return this.sendTemplateMessage({
      customerId: payment.customerId,
      phone: payment.customer.phone,
      templateName: 'payment_received',
      linkedEntityType: 'PAYMENT',
      linkedEntityId: payment.id,
      variables: {
        bodyParameters: [payment.customer.name, Number(payment.amount).toString(), payment.paymentNumber]
      }
    });
  }

  /**
   * Manually triggerable payment reminder — fires against an outstanding ISSUED invoice.
   * Pilot: call this from an admin action or a future scheduled job.
   */
  async sendPaymentReminder(invoiceId: string) {
    const invoice = await this.db.client.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });
    if (!invoice || !invoice.customer || !invoice.customer.phone) return;
    if (!['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status)) return; // Only remind on outstanding invoices

    return this.sendTemplateMessage({
      customerId: invoice.customerId,
      phone: invoice.customer.phone,
      templateName: 'payment_reminder',
      linkedEntityType: 'INVOICE',
      linkedEntityId: invoice.id,
      variables: {
        bodyParameters: [invoice.customer.name, invoice.invoiceNumber, Number(invoice.balanceDue).toString()]
      }
    });
  }
}
