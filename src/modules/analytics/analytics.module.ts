import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Transaction } from '../transaction/transaction.entity';
import { TransactionItem } from '../transaction/transaction-item.entity';
import { Product } from '../product/product.entity';
import { Store } from '../store/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionItem, Product, Store]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
