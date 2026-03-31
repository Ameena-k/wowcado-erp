import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PostingEngineService } from '../posting-engine/posting-engine.service';
import { randomBytes } from 'crypto';
import { ExpenseStatus } from '@wowcado/database';

@Injectable()
export class ExpensesService {
  constructor(
    private db: DatabaseService,
    private postingEngine: PostingEngineService
  ) {}

  async create(data: any) {
    const expense = await this.db.client.expense.create({
      data: {
        ...data,
        expenseNumber: `EXP-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date()
      }
    });

    if (expense.status === 'PAID') {
      await this.postingEngine.postExpense(expense.id);
    }
    return expense;
  }

  async findAll(search?: string, categoryId?: string, status?: string, vendorId?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status as ExpenseStatus;
    if (vendorId) where.vendorId = vendorId;

    if (search) {
      where.OR = [
        { expenseNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [data, total] = await Promise.all([
      this.db.client.expense.findMany({ 
        where, 
        include: { category: true, vendor: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.db.client.expense.count({ where })
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const exp = await this.db.client.expense.findUnique({
      where: { id },
      include: { category: true, vendor: true }
    });
    if (!exp) throw new NotFoundException('Expense not found');
    return exp;
  }

  async updateStatus(id: string, status: any) {
    const expense = await this.db.client.expense.update({
      where: { id },
      data: { status }
    });
    if (status === 'PAID') {
      await this.postingEngine.postExpense(expense.id);
    }
    return expense;
  }
}
