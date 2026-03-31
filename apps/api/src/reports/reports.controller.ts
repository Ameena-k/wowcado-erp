import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(@Query() query: ReportFilterDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('invoices')
  getInvoiceReport(@Query() query: ReportFilterDto) {
    return this.reportsService.getInvoiceReport(query);
  }

  @Get('collections')
  getCollectionsReport(@Query() query: ReportFilterDto) {
    return this.reportsService.getCollectionsReport(query);
  }

  @Get('customer-outstanding')
  getCustomerOutstandingReport(@Query() query: ReportFilterDto) {
    return this.reportsService.getCustomerOutstandingReport(query);
  }

  @Get('vendor-payable')
  getVendorPayableReport(@Query() query: ReportFilterDto) {
    return this.reportsService.getVendorPayableReport(query);
  }

  @Get('expenses')
  getExpenseReport(@Query() query: ReportFilterDto) {
    return this.reportsService.getExpenseReport(query);
  }

  @Get('journal-entries')
  getJournalEntriesReport(@Query() query: ReportFilterDto) {
    return this.reportsService.getJournalEntriesReport(query);
  }

  @Get('ledger/:accountId')
  getLedgerByAccount(@Param('accountId') accountId: string, @Query() query: ReportFilterDto) {
    return this.reportsService.getLedgerByAccount(accountId, query);
  }

  @Get('daybook')
  getDayBook(@Query() query: ReportFilterDto) {
    return this.reportsService.getDayBook(query);
  }
}
