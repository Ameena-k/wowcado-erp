import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class InvoiceItemsService {
  constructor(private readonly db: DatabaseService) {}

  async create(invoiceId: string, createInvoiceItemDto: CreateInvoiceItemDto) {
    const item = await this.db.client.invoiceItem.create({
      data: {
        ...createInvoiceItemDto,
        invoiceId,
        lineTotal: (createInvoiceItemDto.quantity * createInvoiceItemDto.unitPrice) - (createInvoiceItemDto.lineDiscountAmount || 0) + createInvoiceItemDto.taxAmount
      }
    });

    // In a real app we'd recalculate the invoice headers here, but we'll leave it simple for Phase 1
    return item;
  }

  findAllByInvoice(invoiceId: string) {
    return this.db.client.invoiceItem.findMany({
      where: { invoiceId }
    });
  }

  findOne(id: string) {
    return this.db.client.invoiceItem.findUnique({ where: { id } });
  }

  update(id: string, updateInvoiceItemDto: UpdateInvoiceItemDto) {
    return this.db.client.invoiceItem.update({
      where: { id },
      data: updateInvoiceItemDto as any
    });
  }

  remove(id: string) {
    return this.db.client.invoiceItem.delete({
      where: { id }
    });
  }
}
