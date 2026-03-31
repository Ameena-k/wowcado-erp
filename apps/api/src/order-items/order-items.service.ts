import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class OrderItemsService {
  constructor(private readonly db: DatabaseService) {}

  findAllByOrder(orderId: string) {
    return this.db.client.orderItem.findMany({ where: { orderId }});
  }
}
