import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  customerId: string;

  @IsString()
  customerAddressId: string;

  @IsOptional()
  @IsString()
  deliveryZoneId?: string;

  @IsOptional()
  @IsString()
  deliverySlotId?: string;

  @IsString()
  orderDate: string;

  @IsString()
  deliveryDate: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  overrideDeliveryCharge?: number;

  @IsOptional()
  @IsBoolean()
  taxOnDelivery?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items: OrderItemDto[];
}
