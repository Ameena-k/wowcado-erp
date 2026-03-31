import { IsString, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  productNameSnapshot: string;

  @IsOptional()
  @IsString()
  skuSnapshot?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lineDiscountAmount?: number;

  @IsNumber()
  taxRateSnapshot: number;

  @IsNumber()
  taxAmount: number;
}
