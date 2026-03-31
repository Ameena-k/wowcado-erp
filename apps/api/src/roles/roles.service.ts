import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RolesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.client.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }
}
