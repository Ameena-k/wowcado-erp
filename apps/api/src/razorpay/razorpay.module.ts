import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';
import { DatabaseModule } from '../database/database.module';
import { PaymentAllocationsModule } from '../payment-allocations/payment-allocations.module';
import { PostingEngineModule } from '../posting-engine/posting-engine.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PaymentAllocationsModule,
    PostingEngineModule,
  ],
  controllers: [RazorpayController],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class RazorpayModule {}
