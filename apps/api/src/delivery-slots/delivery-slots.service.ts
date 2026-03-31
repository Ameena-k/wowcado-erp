import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DeliverySlotsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(activeStr?: string) {
    const where: any = {};
    if (activeStr !== undefined) {
      where.active = activeStr === 'true';
    }
    return this.db.client.deliverySlot.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });
  }
}
