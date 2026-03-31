import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSocietyDto {
  @IsString() name: string;
  @IsOptional() @IsString() areaOrLocality?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
