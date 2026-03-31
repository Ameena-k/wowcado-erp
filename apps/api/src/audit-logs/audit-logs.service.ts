import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly db: DatabaseService) {}

  async createLog(userId: string | null, action: string, resource: string, details?: any, ipAddress?: string): Promise<any> {
    return this.db.client.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? details : undefined,
        ipAddress,
      },
    });
  }
}
