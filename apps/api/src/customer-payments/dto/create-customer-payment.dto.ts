import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@wowcado/database';
import { CreatePaymentAllocationDto } from '../../payment-allocations/dto/create-payment-allocation.dto';

export class CreateCustomerPaymentDto {
  @IsUUID()
  customerId: string;

  @IsDateString()
  paymentDate: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentAllocationDto)
  allocations?: CreatePaymentAllocationDto[];
}
