import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerPaymentDto } from './create-customer-payment.dto';

export class UpdateCustomerPaymentDto extends PartialType(CreateCustomerPaymentDto) {}
