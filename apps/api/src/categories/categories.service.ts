import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.client.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
