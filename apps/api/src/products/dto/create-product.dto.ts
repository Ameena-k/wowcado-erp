import { IsString, IsNumber, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  sku: string; // Required Manual SKU

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  categoryId: string;

  @IsString()
  @MaxLength(50)
  unit: string;

  @IsNumber()
  @Type(() => Number)
  sellingPrice: number;

  @IsString()
  taxRateId: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
