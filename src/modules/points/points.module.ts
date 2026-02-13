import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { UserModule } from '../user/user.module';
import { User } from '../user/user.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule, NotificationModule],
  controllers: [PointsController],
  providers: [PointsService],
})
export class PointsModule {}
