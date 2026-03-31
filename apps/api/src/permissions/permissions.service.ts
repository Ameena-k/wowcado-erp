import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.client.permission.findMany();
  }
}
