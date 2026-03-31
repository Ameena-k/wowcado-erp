import { Module } from '@nestjs/common';
import { PostingEngineService } from './posting-engine.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PostingEngineService],
  exports: [PostingEngineService],
})
export class PostingEngineModule {}
