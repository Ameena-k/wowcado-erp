import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { DatabaseModule } from '../database/database.module';
import { PostingEngineModule } from '../posting-engine/posting-engine.module';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [DatabaseModule, PostingEngineModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
