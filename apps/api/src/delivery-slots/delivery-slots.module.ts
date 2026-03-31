import { Module } from '@nestjs/common';
import { DeliverySlotsController } from './delivery-slots.controller';
import { DeliverySlotsService } from './delivery-slots.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliverySlotsController],
  providers: [DeliverySlotsService],
})
export class DeliverySlotsModule {}
