import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AccountType } from '@wowcado/database';

export class CreateAccountDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
