import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateDeliveryZoneDto {
  @IsString() name!: string;
  @IsString() pincode!: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsNumber() deliveryCharge!: number;
  @IsOptional() @IsNumber() minimumOrderAmount?: number;
}
