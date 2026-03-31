import { IsString, IsBoolean, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateDeliverySlotDto {
  @IsString() name: string;
  @IsString() displayName: string;
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}
