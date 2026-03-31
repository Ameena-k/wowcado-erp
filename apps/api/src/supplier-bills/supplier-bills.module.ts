import { Module } from '@nestjs/common';
import { SupplierBillsController } from './supplier-bills.controller';
import { SupplierBillsService } from './supplier-bills.service';
import { DatabaseModule } from '../database/database.module';
import { PostingEngineModule } from '../posting-engine/posting-engine.module';

@Module({
  imports: [DatabaseModule, PostingEngineModule],
  controllers: [SupplierBillsController],
  providers: [SupplierBillsService],
})
export class SupplierBillsModule {}
