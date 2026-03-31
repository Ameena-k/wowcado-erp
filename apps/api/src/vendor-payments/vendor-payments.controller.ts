import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { VendorPaymentsService } from './vendor-payments.service';

@Controller('vendor-payments')
export class VendorPaymentsController {
  constructor(private readonly vendorPaymentsService: VendorPaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  create(@Body() data: any) {
    return this.vendorPaymentsService.create(data);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.vendorPaymentsService.findAll(search, vendorId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorPaymentsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.vendorPaymentsService.updateStatus(id, status);
  }
}
