import { Controller, Get, Query } from '@nestjs/common';
import { DeliverySlotsService } from './delivery-slots.service';

@Controller('delivery-slots')
export class DeliverySlotsController {
  constructor(private readonly deliverySlotsService: DeliverySlotsService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return this.deliverySlotsService.findAll(active);
  }
}
