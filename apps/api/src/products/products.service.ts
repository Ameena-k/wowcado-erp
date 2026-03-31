import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(search?: string, categoryId?: string, activeStr?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    
    if (activeStr !== undefined && activeStr !== '') {
      where.active = activeStr === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.client.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          taxRate: { select: { id: true, name: true, rate: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.db.client.product.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const product = await this.db.client.product.findUnique({
      where: { id },
      include: {
        category: true,
        taxRate: true,
        _count: { select: { orderItems: true, invoiceItems: true } }
      }
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const exists = await this.db.client.product.findUnique({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException(`SKU ${dto.sku} already exists`);

    return this.db.client.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        categoryId: dto.categoryId,
        unit: dto.unit,
        sellingPrice: dto.sellingPrice,
        taxRateId: dto.taxRateId,
        active: dto.active ?? true,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.db.client.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.sku && dto.sku !== product.sku) {
      const exists = await this.db.client.product.findUnique({ where: { sku: dto.sku } });
      if (exists) throw new ConflictException(`SKU ${dto.sku} already exists`);
    }

    return this.db.client.product.update({
      where: { id },
      data: {
        sku: dto.sku,
        name: dto.name,
        categoryId: dto.categoryId,
        unit: dto.unit,
        sellingPrice: dto.sellingPrice,
        taxRateId: dto.taxRateId,
        active: dto.active,
        description: dto.description,
      } as any,
    });
  }

  async remove(id: string) {
    const product = await this.db.client.product.findUnique({
      where: { id },
      include: {
        _count: { select: { orderItems: true, invoiceItems: true } }
      }
    });

    if (!product) throw new NotFoundException('Product not found');

    if (product._count.orderItems > 0 || product._count.invoiceItems > 0) {
      throw new ConflictException('Cannot delete product because it has existing transactional history. Please mark it as Inactive instead.');
    }

    return this.db.client.product.delete({ where: { id } });
  }
}
