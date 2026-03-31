import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreatePaymentAllocationDto {
  @IsUUID()
  invoiceId: string;

  @IsNumber()
  @Min(0)
  allocatedAmount: number;
}
