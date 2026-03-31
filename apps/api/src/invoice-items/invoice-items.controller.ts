import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InvoiceItemsService } from './invoice-items.service';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';

@Controller('invoices/:invoiceId/items')
export class InvoiceItemsController {
  constructor(private readonly invoiceItemsService: InvoiceItemsService) {}

  @Post()
  create(@Param('invoiceId') invoiceId: string, @Body() createInvoiceItemDto: CreateInvoiceItemDto) {
    return this.invoiceItemsService.create(invoiceId, createInvoiceItemDto);
  }

  @Get()
  findAll(@Param('invoiceId') invoiceId: string) {
    return this.invoiceItemsService.findAllByInvoice(invoiceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceItemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceItemDto: UpdateInvoiceItemDto) {
    return this.invoiceItemsService.update(id, updateInvoiceItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceItemsService.remove(id);
  }
}
