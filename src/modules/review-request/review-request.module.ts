import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewRequest } from './review-request.entity';
import { ReviewRequestService } from './review-request.service';
import { ReviewRequestController } from './review-request.controller';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { TransactionItem } from '../transaction/transaction-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewRequest, TransactionItem]),
    ProductModule,
    UserModule,
  ],
  controllers: [ReviewRequestController],
  providers: [ReviewRequestService],
})
export class ReviewRequestModule {}
