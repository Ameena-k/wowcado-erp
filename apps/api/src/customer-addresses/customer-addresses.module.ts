import { Module } from '@nestjs/common';
import { CustomerAddressesService } from './customer-addresses.service';
import { CustomerAddressesController } from './customer-addresses.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [CustomerAddressesService],
  controllers: [CustomerAddressesController],
  exports: [CustomerAddressesService],
})
export class CustomerAddressesModule {}
