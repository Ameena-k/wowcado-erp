import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CustomerAddressesService } from './customer-addresses.service';

@Controller('customer-addresses')
export class CustomerAddressesController {
  constructor(private readonly customerAddressesService: CustomerAddressesService) {}

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.customerAddressesService.findAll(customerId);
  }

  @Post()
  create(@Body() body: any) {
    return this.customerAddressesService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerAddressesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.customerAddressesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerAddressesService.remove(id);
  }
}
