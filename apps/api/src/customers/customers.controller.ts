import { Controller, Get, Post, Body, Param, Put, Delete, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.customersService.findAll(search, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Post('bulk-delete')
  @Roles('SUPER_ADMIN', 'ADMIN')
  bulkRemove(@Body() payload: { ids: string[] }) {
    return this.customersService.bulkRemove(payload.ids);
  }

  @Post('import')
  @Roles('ADMIN', 'ACCOUNTANT')
  async importCsv(@Body() payload: { rows: any[] }) {
    if (!payload.rows || !Array.isArray(payload.rows)) return { message: 'Invalid payload' };
    return this.customersService.importCsv(payload.rows);
  }

  @Get('export/csv')
  @Roles('ADMIN', 'ACCOUNTANT')
  async exportCsv(@Res() res: Response) {
    const csvData = await this.customersService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers_export.csv');
    res.send(csvData);
  }
}
