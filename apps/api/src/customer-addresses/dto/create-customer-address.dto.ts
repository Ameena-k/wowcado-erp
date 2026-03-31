import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateCustomerAddressDto {
  @IsUUID() customerId: string;
  @IsUUID() societyId: string;
  @IsOptional() @IsString() label?: string;
  @IsString() recipientName: string;
  @IsString() phone: string;
  @IsString() blockOrStreet: string;
  @IsString() doorNo: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
