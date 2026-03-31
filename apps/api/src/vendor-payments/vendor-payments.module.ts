import { Module } from '@nestjs/common';
import { VendorPaymentsController } from './vendor-payments.controller';
import { VendorPaymentsService } from './vendor-payments.service';
import { DatabaseModule } from '../database/database.module';
import { PostingEngineModule } from '../posting-engine/posting-engine.module';

@Module({
  imports: [DatabaseModule, PostingEngineModule],
  controllers: [VendorPaymentsController],
  providers: [VendorPaymentsService],
})
export class VendorPaymentsModule {}
