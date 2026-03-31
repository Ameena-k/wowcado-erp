import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { DatabaseModule } from '../database/database.module';
import { CustomerAddressesModule } from '../customer-addresses/customer-addresses.module';

@Module({
  imports: [DatabaseModule, CustomerAddressesModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
