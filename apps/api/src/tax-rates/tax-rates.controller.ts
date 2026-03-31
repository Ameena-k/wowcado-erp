import { Controller, Get } from '@nestjs/common';
import { TaxRatesService } from './tax-rates.service';

@Controller('tax-rates')
export class TaxRatesController {
  constructor(private readonly taxRatesService: TaxRatesService) {}

  @Get()
  findAll() {
    return this.taxRatesService.findAll();
  }
}
