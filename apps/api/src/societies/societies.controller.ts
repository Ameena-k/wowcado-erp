import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SocietiesService } from './societies.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('societies')
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.societiesService.findAll(activeOnly);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() createDto: CreateSocietyDto) {
    return this.societiesService.create(createDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.societiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateDto: UpdateSocietyDto) {
    return this.societiesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.societiesService.remove(id);
  }
}
