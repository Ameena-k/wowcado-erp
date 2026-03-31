import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AccountsService {
  constructor(private readonly db: DatabaseService) {}

  create(createAccountDto: CreateAccountDto) {
    return this.db.client.account.create({ data: createAccountDto as any });
  }

  findAll() {
    return this.db.client.account.findMany();
  }

  findOne(id: string) {
    return this.db.client.account.findUnique({ where: { id }});
  }

  update(id: string, updateAccountDto: UpdateAccountDto) {
    return this.db.client.account.update({ where: { id }, data: updateAccountDto as any });
  }

  remove(id: string) {
    return this.db.client.account.update({ where: { id }, data: { isActive: false } });
  }
}
