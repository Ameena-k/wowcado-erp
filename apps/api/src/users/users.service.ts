import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string) {
    return this.db.client.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });
  }

  async findById(id: string) {
    return this.db.client.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });
  }
}
