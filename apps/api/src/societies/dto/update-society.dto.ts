import { PartialType } from '@nestjs/mapped-types';
import { CreateSocietyDto } from './create-society.dto';

export class UpdateSocietyDto extends PartialType(CreateSocietyDto) {}
