import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './offer.entity';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { UserModule } from '../user/user.module';
import { StoreModule } from '../store/store.module';
import { PromotionModule } from '../promotion/promotion.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer]),
    UserModule,
    StoreModule,
    PromotionModule,
    NotificationModule,
  ],
  controllers: [OfferController],
  providers: [OfferService],
  exports: [OfferService],
})
export class OfferModule {}
