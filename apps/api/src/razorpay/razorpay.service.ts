import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import { DatabaseService } from '../database/database.service';
import { PaymentAllocationsService } from '../payment-allocations/payment-allocations.service';
import { PostingEngineService } from '../posting-engine/posting-engine.service';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly rz: any;
  private readonly webhookSecret: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly allocations: PaymentAllocationsService,
    private readonly postingEngine: PostingEngineService,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_dummy';
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET') || 'dummy_secret';
    this.webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET') || 'test-webhook-secret';
    this.rz = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  // Accessor: bypasses stale IDE Prisma type cache — GatewayTransaction exists at runtime
  private get gw() {
    return (this.db.client as any).gatewayTransaction;
  }

  // ── Order Creation ──────────────────────────────────────────────────────────
  async createOrder(params: {
    amountInr: number;
    receipt: string;
    invoiceId?: string;
    customerId?: string;
    notes?: Record<string, string>;
  }) {
    const { amountInr, receipt, invoiceId, customerId, notes } = params;
    const amountPaise = Math.round(amountInr * 100);

    const rzNotes: Record<string, string> = {
      ...(notes || {}),
      ...(invoiceId ? { invoiceId } : {}),
      ...(customerId ? { customerId } : {}),
    };

    const order = await this.rz.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: rzNotes,
    });

    this.logger.log(`Razorpay order created: ${order.id} | Amount: ₹${amountInr}`);
    return order;
  }

  // ── Webhook Signature Verification ─────────────────────────────────────────
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook');
      return false;
    }
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  // ── Main Webhook Handler ────────────────────────────────────────────────────
  async handleWebhook(rawBody: Buffer, signature: string, eventId: string): Promise<{ status: string }> {
    // 1. Verify HMAC signature first (fail fast)
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn(`Webhook signature mismatch for event ${eventId}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const eventType: string = payload.event;
    const entity = payload.payload?.payment?.entity;

    this.logger.log(`Webhook received: ${eventType} | eventId: ${eventId}`);

    // 2. Idempotency check — already PROCESSED? Skip entirely
    const existing = await this.gw.findUnique({ where: { razorpayEventId: eventId } });

    if (existing && existing.status === 'PROCESSED') {
      this.logger.log(`Duplicate event suppressed: ${eventId} (already PROCESSED)`);
      return { status: 'duplicate_ignored' };
    }

    // 3. Persist raw event (upsert for retry safety on FAILED events)
    const amountPaise: number = entity?.amount ?? 0;
    const amountInr = amountPaise / 100;

    const gatewayTx = await this.gw.upsert({
      where: { razorpayEventId: eventId },
      create: {
        razorpayEventId: eventId,
        razorpayOrderId: entity?.order_id ?? null,
        razorpayPaymentId: entity?.id ?? null,
        razorpaySignature: signature,
        eventType,
        status: 'RECEIVED',
        rawPayload: payload,
        amountPaise,
        amountInr,
        currency: entity?.currency ?? 'INR',
        notes: entity?.notes ?? null,
      },
      update: {
        status: 'RECEIVED',
        processingError: null,
        rawPayload: payload,
      },
    });

    // 4. Route to handler
    try {
      switch (eventType) {
        case 'payment.captured':
          await this.handlePaymentCaptured(gatewayTx.id, entity, amountInr);
          break;

        case 'payment.authorized':
        case 'payment.failed':
        case 'refund.created':
          await this.gw.update({ where: { id: gatewayTx.id }, data: { status: 'IGNORED' } });
          break;

        default:
          this.logger.log(`Unhandled event type: ${eventType} — marking IGNORED`);
          await this.gw.update({ where: { id: gatewayTx.id }, data: { status: 'IGNORED' } });
      }
    } catch (err: any) {
      this.logger.error(`Error processing webhook ${eventId}: ${err.message}`);
      await this.gw.update({
        where: { id: gatewayTx.id },
        data: { status: 'FAILED', processingError: err.message },
      });
      // Do NOT rethrow — processing failures are logged in GatewayTransaction
      // Rethrowing causes Razorpay to retry the same event (undesirable for FAILED state)
      return { status: 'failed_logged' };
    }

    return { status: 'ok' };
  }

  // ── payment.captured Handler ────────────────────────────────────────────────
  private async handlePaymentCaptured(
    gatewayTxId: string,
    entity: any,
    amountInr: number,
  ) {
    const razorpayOrderId: string = entity?.order_id;
    const razorpayPaymentId: string = entity?.id;
    const notes: Record<string, string> = entity?.notes ?? {};

    // Resolve ERP context from notes stored at order creation
    const invoiceId: string | undefined = notes.invoiceId;
    const customerId: string | undefined = notes.customerId;

    if (!invoiceId || !customerId) {
      this.logger.warn(`payment.captured missing invoiceId/customerId in notes — Order: ${razorpayOrderId}`);
      await this.gw.update({ where: { id: gatewayTxId }, data: { status: 'IGNORED' } });
      return;
    }

    // Load invoice
    const invoice = await this.db.client.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      this.logger.warn(`Invoice ${invoiceId} not found — marking IGNORED`);
      await this.gw.update({ where: { id: gatewayTxId }, data: { status: 'IGNORED' } });
      return;
    }

    // 2nd-layer idempotency: check if a CustomerPayment already exists for this razorpayPaymentId
    const existingPayment = await this.db.client.customerPayment.findFirst({
      where: { razorpayPaymentId } as any,
    });

    if (existingPayment) {
      this.logger.warn(`Duplicate payment for razorpayPaymentId ${razorpayPaymentId} suppressed`);
      await this.gw.update({
        where: { id: gatewayTxId },
        data: { status: 'DUPLICATE', customerPaymentId: existingPayment.id, invoiceId },
      });
      return;
    }

    // Create CustomerPayment
    const paymentNumber = `RZPAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const payment = await this.db.client.customerPayment.create({
      data: {
        paymentNumber,
        customerId,
        paymentDate: new Date(),
        amount: amountInr,
        allocatedAmount: 0,
        unallocatedAmount: amountInr,
        paymentMethod: 'RAZORPAY' as any,
        referenceNumber: razorpayPaymentId,
        notes: `Auto-captured via Razorpay. Order: ${razorpayOrderId}`,
        status: 'COMPLETED' as any,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: entity?.signature ?? null,
      } as any,
    });

    // Allocate up to balanceDue
    const allocationAmount = Math.min(amountInr, Number(invoice.balanceDue));
    if (allocationAmount > 0) {
      await this.allocations.create(payment.id, {
        invoiceId,
        allocatedAmount: allocationAmount as any,
      });
    }

    // Trigger accounting posting
    await this.postingEngine.postCustomerPayment(payment.id);

    // Mark gateway tx PROCESSED and link IDs
    await this.gw.update({
      where: { id: gatewayTxId },
      data: { status: 'PROCESSED', customerPaymentId: payment.id, invoiceId },
    });

    this.logger.log(`✓ payment.captured processed: ${razorpayPaymentId} → CustomerPayment ${payment.id}`);
  }

  // ── Admin: List Gateway Transactions ────────────────────────────────────────
  async listTransactions(search?: string, status?: string, page = 1, limit = 50) {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { razorpayOrderId: { contains: search, mode: 'insensitive' } },
        { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
        { razorpayEventId: { contains: search, mode: 'insensitive' } },
        { eventType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.gw.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          razorpayEventId: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          eventType: true,
          status: true,
          amountInr: true,
          currency: true,
          customerPaymentId: true,
          invoiceId: true,
          processingError: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.gw.count({ where }),
    ]);

    return { data, total };
  }

  async getTransaction(id: string) {
    return this.gw.findUnique({ where: { id } });
  }
}
