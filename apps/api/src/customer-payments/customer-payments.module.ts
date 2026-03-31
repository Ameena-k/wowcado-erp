import { Module } from '@nestjs/common';
import { CustomerPaymentsService } from './customer-payments.service';
import { CustomerPaymentsController } from './customer-payments.controller';
import { DatabaseModule } from '../database/database.module';
import { PaymentAllocationsModule } from '../payment-allocations/payment-allocations.module';
import { PostingEngineModule } from '../posting-engine/posting-engine.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [DatabaseModule, PaymentAllocationsModule, PostingEngineModule, WhatsappModule],
  controllers: [CustomerPaymentsController],
  providers: [CustomerPaymentsService],
})
export class CustomerPaymentsModule {}
