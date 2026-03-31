import {
  Controller, Post, Get, Param, Query,
  Req, Res, RawBodyRequest, HttpCode, Headers, Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RazorpayService } from './razorpay.service';

@Controller('razorpay')
export class RazorpayController {
  private readonly logger = new Logger(RazorpayController.name);

  constructor(private readonly razorpayService: RazorpayService) {}

  // ── Create Razorpay Order (called by admin/server before Checkout) ──────────
  @Post('orders')
  async createOrder(@Req() req: any) {
    const { amountInr, receipt, invoiceId, customerId, notes } = req.body;
    return this.razorpayService.createOrder({ amountInr, receipt, invoiceId, customerId, notes });
  }

  // ── Webhook (Razorpay calls this on payment events) ─────────────────────────
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-razorpay-signature') signature: string,
    @Headers('x-razorpay-event-id') eventId: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      this.logger.error('rawBody is undefined — ensure NestJS is configured with rawBody: true');
      return res.status(400).json({ error: 'Missing raw body' });
    }

    if (!signature) {
      return res.status(400).json({ error: 'Missing X-Razorpay-Signature header' });
    }

    // Deterministic fallback eventId: prevents duplicate processing when
    // x-razorpay-event-id header is absent (older Razorpay accounts)
    // Uses order+payment IDs so the same event always yields the same key
    let safeEventId = eventId;
    if (!safeEventId) {
      try {
        const body = JSON.parse(rawBody.toString('utf8'));
        const entity = body.payload?.payment?.entity;
        const orderId = entity?.order_id || 'noorder';
        const paymentId = entity?.id || 'nopayment';
        safeEventId = `fallback-${orderId}-${paymentId}`;
      } catch {
        safeEventId = `fallback-sig-${signature.slice(0, 16)}`;
      }
    }

    try {
      const result = await this.razorpayService.handleWebhook(rawBody, signature, safeEventId);
      return res.json(result);
    } catch (err: any) {
      this.logger.error(`Webhook error: ${err.message}`);
      // 400 ONLY for invalid signature — Razorpay should not retry those
      // For all internal processing failures, return 200 so Razorpay doesn't flood with retries
      // The GatewayTransaction record captures the error for manual resolution
      if (err.status === 400 && err.message?.includes('signature')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ status: 'error_logged', message: 'Internal processing error logged' });
    }
  }

  // ── Admin: List gateway transactions ────────────────────────────────────────
  @Get('transactions')
  listTransactions(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.razorpayService.listTransactions(
      search,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('transactions/:id')
  getTransaction(@Param('id') id: string) {
    return this.razorpayService.getTransaction(id);
  }
}
