import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receipt } from './receipt.entity';
import { ReceiptService } from './receipt.service';
import { ReceiptFetcherService } from './receipt-fetcher.service';
import { ReceiptController } from './receipt.controller';
import { UserModule } from '../user/user.module';
import { StoreModule } from '../store/store.module';
import { ProductModule } from '../product/product.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receipt]),
    UserModule,
    StoreModule,
    ProductModule,
    TransactionModule,
  ],
  controllers: [ReceiptController],
  providers: [ReceiptService, ReceiptFetcherService],
  exports: [ReceiptService],
})
export class ReceiptModule {}
