import { Module } from '@nestjs/common';
import { DeliveryZonesController } from './delivery-zones.controller';
import { DeliveryZonesService } from './delivery-zones.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryZonesController],
  providers: [DeliveryZonesService],
})
export class DeliveryZonesModule {}
