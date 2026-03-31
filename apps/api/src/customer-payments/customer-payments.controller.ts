import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CustomerPaymentsService } from './customer-payments.service';
import { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto';
import { UpdateCustomerPaymentDto } from './dto/update-customer-payment.dto';

@Controller('customer-payments')
export class CustomerPaymentsController {
  constructor(private readonly customerPaymentsService: CustomerPaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  create(@Body() createCustomerPaymentDto: CreateCustomerPaymentDto) {
    return this.customerPaymentsService.create(createCustomerPaymentDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
  ) {
    return this.customerPaymentsService.findAll(search, customerId, status, method);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerPaymentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  update(@Param('id') id: string, @Body() updateCustomerPaymentDto: UpdateCustomerPaymentDto) {
    return this.customerPaymentsService.update(id, updateCustomerPaymentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  remove(@Param('id') id: string) {
    return this.customerPaymentsService.remove(id);
  }
}
