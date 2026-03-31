import { IsString, IsEmail, IsOptional, MaxLength, IsIn, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DefaultAddressDto {
  @IsUUID()
  societyId: string;

  @IsString()
  @MaxLength(255)
  blockOrStreet: string;

  @IsString()
  @MaxLength(100)
  doorNo: string;

  @IsString()
  @MaxLength(255)
  recipientName: string;

  @IsString()
  @MaxLength(50)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;
}

export class CreateCustomerDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(50)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ValidateNested()
  @Type(() => DefaultAddressDto)
  defaultAddress: DefaultAddressDto;
}
