import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GstService } from './gst.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('gst')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
export class GstController {
  constructor(private readonly gstService: GstService) {}

  @Get('dashboard')
  getDashboardSummary(@Query('month') month: string, @Query('year') year: string) {
    return this.gstService.getDashboardSummary(Number(month), Number(year));
  }

  @Get('gstr1')
  getGstr1List(@Query('month') month: string, @Query('year') year: string) {
    return this.gstService.getGstr1(Number(month), Number(year));
  }

  @Get('gstr2b')
  getGstr2bList(@Query('month') month: string, @Query('year') year: string) {
    return this.gstService.getGstr2b(Number(month), Number(year));
  }

  @Get('gstr3b')
  getGstr3bSummary(@Query('month') month: string, @Query('year') year: string) {
    return this.gstService.getGstr3b(Number(month), Number(year));
  }
}
