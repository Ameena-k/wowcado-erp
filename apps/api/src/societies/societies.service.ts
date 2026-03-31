import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';

@Injectable()
export class SocietiesService {
  constructor(private readonly db: DatabaseService) {}

  create(dto: CreateSocietyDto) {
    return this.db.client.society.create({ data: dto });
  }

  findAll(activeOnly?: boolean) {
    const where = activeOnly ? { isActive: true } : {};
    return this.db.client.society.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  findOne(id: string) {
    return this.db.client.society.findUnique({ where: { id }});
  }

  update(id: string, updateDto: UpdateSocietyDto) {
    return this.db.client.society.update({ where: { id }, data: updateDto });
  }

  remove(id: string) {
    return this.db.client.society.delete({ where: { id }});
  }
}
