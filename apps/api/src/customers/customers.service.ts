import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { RecordStatus } from '@wowcado/database';

@Injectable()
export class CustomersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(search?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status as RecordStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.client.customer.findMany({
        where,
        orderBy: { name: 'asc' },
      }),
      this.db.client.customer.count({ where }),
    ]);
    
    return { data, total };
  }

  async findOne(id: string) {
    const customer = await this.db.client.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true, invoices: true, payments: true }
        }
      }
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const { defaultAddress, ...customerFields } = dto;

    try {
      return await this.db.client.$transaction(async (tx) => {
        // 1. Create the customer record
        const customer = await tx.customer.create({
          data: {
            name: customerFields.name,
            phone: customerFields.phone,
            email: customerFields.email || null,
            notes: customerFields.notes,
            status: (customerFields.status || 'ACTIVE') as RecordStatus,
          } as any,
        });

        // 2. Create the default delivery address linked to the new customer
        await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            societyId: defaultAddress.societyId,
            blockOrStreet: defaultAddress.blockOrStreet,
            doorNo: defaultAddress.doorNo,
            recipientName: defaultAddress.recipientName,
            phone: defaultAddress.phone,
            landmark: defaultAddress.landmark || null,
            isDefault: true,
          },
        });

        return customer;
      });
    } catch (e: any) {
      console.error("CUSTOMER CREATION ERROR:", e);
      if (e.code === 'P2002') {
        throw new BadRequestException('A customer with this phone number or email already exists.');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const exists = await this.db.client.customer.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Customer not found');

    return this.db.client.customer.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
        ...(dto.status ? { status: dto.status as RecordStatus } : {}),
      },
    });
  }

  async remove(id: string) {
    const customer = await this.db.client.customer.findUnique({
      where: { id },
      include: { _count: { select: { orders: true, invoices: true, payments: true } } }
    });

    if (!customer) throw new NotFoundException('Customer not found');

    if (customer._count.orders > 0 || customer._count.invoices > 0 || customer._count.payments > 0) {
      throw new BadRequestException('Cannot strictly delete a customer with transactional history. Please mark their status as Inactive instead.');
    }

    return await this.db.client.$transaction(async (tx) => {
      await tx.customerAddress.deleteMany({ where: { customerId: id } });
      await tx.whatsappMessageLog.deleteMany({ where: { customerId: id } });
      return await tx.customer.delete({ where: { id } });
    });
  }

  async bulkRemove(ids: string[]) {
    // We only allow deleting customers that have 0 orders and 0 invoices
    const customers = await this.db.client.customer.findMany({
      where: { id: { in: ids } },
      include: {
        _count: { select: { orders: true, invoices: true, payments: true } }
      }
    });

    const safeToDeleteIds = customers
      .filter(c => c._count.orders === 0 && c._count.invoices === 0 && c._count.payments === 0)
      .map(c => c.id);

    if (safeToDeleteIds.length === 0) {
       throw new BadRequestException('None of the selected customers can be strictly deleted because they have existing transaction histories.');
    }

    return await this.db.client.$transaction(async (tx) => {
      await tx.customerAddress.deleteMany({ where: { customerId: { in: safeToDeleteIds } } });
      await tx.whatsappMessageLog.deleteMany({ where: { customerId: { in: safeToDeleteIds } } });
      await tx.customer.deleteMany({ where: { id: { in: safeToDeleteIds } } });
      return { deletedCount: safeToDeleteIds.length, totalRequested: ids.length };
    });
  }

  // ============== IMPORT & EXPORT ==============

  async exportCsv() {
    const customers = await this.db.client.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        addresses: {
          where: { isDefault: true },
          include: { society: true },
          take: 1
        }
      }
    });

    const headers = [
      'Customer Name', 'Phone', 'Email', 'Society/Apartment', 
      'Block/Street', 'Flat/Door No', 'Landmark', 'Status'
    ];

    const rows = customers.map(c => {
      const addr = c.addresses[0];
      return [
        c.name, c.phone, c.email || '', 
        addr?.society?.name || '', addr?.blockOrStreet || '',
        addr?.doorNo || '', addr?.landmark || '', c.status
      ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  async importCsv(rows: any[]) {
    const societies = await this.db.client.society.findMany({ select: { id: true, name: true } });
    
    // Normalizer to strip special characters and space for fuzzy match
    const normalize = (str: string) => str ? String(str).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const societyMap = societies.map(s => ({ id: s.id, norm: normalize(s.name) }));

    const results = { created: 0, updated: 0, skipped: 0, reviewRequired: 0, failed: 0, details: [] as any[] };

    for (const row of rows) {
      if (!row.phone || !row.name) {
         results.skipped++;
         continue;
      }

      let phoneNorm = String(row.phone).replace(/\D/g, '');
      if (phoneNorm.length > 10 && phoneNorm.startsWith('91')) phoneNorm = phoneNorm.substring(2);

      const normSoc = normalize(row.society);
      const matchedSociety = societyMap.find(s => s.norm === normSoc || s.norm.includes(normSoc) || normSoc.includes(s.norm));
      
      if (!matchedSociety) {
         results.reviewRequired++;
         results.details.push({ row, reason: `Society '${row.society}' unmatched.`, status: 'REVIEW_REQUIRED' });
         continue;
      }

      try {
        const existing = await this.db.client.customer.findUnique({ where: { phone: phoneNorm } });
        
        if (existing) {
           await this.db.client.customer.update({
             where: { id: existing.id },
             data: { name: row.name, email: row.email }
           });
           
           const defaultAddr = await this.db.client.customerAddress.findFirst({ where: { customerId: existing.id, isDefault: true } });
           if (defaultAddr) {
              await this.db.client.customerAddress.update({
                 where: { id: defaultAddr.id },
                 data: { societyId: matchedSociety.id, blockOrStreet: String(row.blockOrStreet || ''), doorNo: String(row.doorNo || ''), landmark: String(row.landmark || '') }
              });
           }
           results.updated++;
        } else {
           await this.db.client.customer.create({
             data: {
               name: row.name, phone: phoneNorm, email: row.email || null,
               addresses: {
                 create: {
                   recipientName: row.name, phone: phoneNorm, isDefault: true,
                   societyId: matchedSociety.id, blockOrStreet: String(row.blockOrStreet || ''), doorNo: String(row.doorNo || ''), landmark: String(row.landmark || '')
                 }
               }
             }
           });
           results.created++;
        }
      } catch (err: any) {
         results.failed++;
         results.details.push({ row, reason: err.message, status: 'FAILED' });
      }
    }
    return results;
  }
}
