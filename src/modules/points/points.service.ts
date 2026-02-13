import { Injectable, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PointsService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async getPoints(userId: string) {
    const user = await this.userService.findOne(userId);
    return {
      userId: user.id,
      pointsBalance: user.pointsBalance,
    };
  }

  async usePoints(userId: string, points: number) {
    const user = await this.userService.findOne(userId);

    if (user.pointsBalance < points) {
      throw new BadRequestException(
        `Insufficient points. Current balance: ${user.pointsBalance}, requested: ${points}`,
      );
    }

    user.pointsBalance -= points;
    await this.userRepository.save(user);

    if (user.pushToken) {
      this.notificationService.sendPushNotification(
        user.pushToken,
        'Points Used',
        `${points} points spent. New balance: ${user.pointsBalance}`,
      );
    }

    return {
      userId: user.id,
      pointsUsed: points,
      newBalance: user.pointsBalance,
    };
  }
}
