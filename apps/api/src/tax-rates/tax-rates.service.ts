import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TaxRatesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.client.taxRate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
