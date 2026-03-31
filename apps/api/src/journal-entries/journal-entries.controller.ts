import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JournalEntriesService } from './journal-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('journal-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Get()
  findAll() {
    return this.journalEntriesService.findAll();
  }

  @Get('ledger/:accountId')
  getLedgerLines(@Param('accountId') accountId: string) {
    return this.journalEntriesService.getLedgerLines(accountId);
  }
}
