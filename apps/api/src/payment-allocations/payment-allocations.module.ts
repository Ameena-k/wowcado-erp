import { Module } from '@nestjs/common';
import { PaymentAllocationsService } from './payment-allocations.service';
import { PaymentAllocationsController } from './payment-allocations.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentAllocationsController],
  providers: [PaymentAllocationsService],
  exports: [PaymentAllocationsService],
})
export class PaymentAllocationsModule {}
