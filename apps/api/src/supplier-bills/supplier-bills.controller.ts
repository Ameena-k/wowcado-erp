import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SupplierBillsService } from './supplier-bills.service';

@Controller('supplier-bills')
export class SupplierBillsController {
  constructor(private readonly supplierBillsService: SupplierBillsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  create(@Body() data: any) {
    return this.supplierBillsService.create(data);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.supplierBillsService.findAll(search, vendorId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierBillsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.supplierBillsService.updateStatus(id, status);
  }
}
