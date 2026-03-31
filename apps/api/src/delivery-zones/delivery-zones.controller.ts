import { Controller, Get, Query } from '@nestjs/common';
import { DeliveryZonesService } from './delivery-zones.service';

@Controller('delivery-zones')
export class DeliveryZonesController {
  constructor(private readonly deliveryZonesService: DeliveryZonesService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.deliveryZonesService.findAll(active);
  }
}
