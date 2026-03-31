import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CustomerAddressesService {
  constructor(private readonly db: DatabaseService) {}

  create(dto: any) {
    return this.db.client.customerAddress.create({ data: dto });
  }

  findAll(customerId?: string) {
    const where = customerId ? { customerId } : {};
    return this.db.client.customerAddress.findMany({
      where,
      orderBy: { isDefault: 'desc' },
      include: { society: true }
    });
  }

  findOne(id: string) {
    return this.db.client.customerAddress.findUnique({ 
      where: { id },
      include: { society: true }
    });
  }

  update(id: string, updateDto: any) {
    return this.db.client.customerAddress.update({ where: { id }, data: updateDto });
  }

  remove(id: string) {
    return this.db.client.customerAddress.delete({ where: { id }});
  }
}
