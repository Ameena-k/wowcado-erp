import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JournalEntriesService {
  constructor(private readonly db: DatabaseService) {}

  findAll() {
    return this.db.client.journalEntry.findMany({ include: { lines: true }});
  }

  async getLedgerLines(accountId: string) {
    const lines = await this.db.client.journalEntryLine.findMany({
      where: { accountId },
      include: {
        journalEntry: true
      },
      orderBy: {
        journalEntry: { entryDate: 'asc' }
      }
    });

    let runningBalance = 0;
    const mapped = lines.map(line => {
      // Basic running balance logic: Since debit and credit neutrality depends on AccountType, 
      // we just track raw math (Debit - Credit) generically in Phase 1 Ledger view.
      const net = Number(line.debitAmount) - Number(line.creditAmount);
      runningBalance += net;
      
      return {
        ...line,
        netChange: net,
        runningBalance
      };
    });

    return mapped;
  }
}
