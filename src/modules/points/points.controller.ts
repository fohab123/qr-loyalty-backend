import { Controller, Get, Post, Body } from '@nestjs/common';
import { PointsService } from './points.service';
import { UsePointsDto } from './dto/use-points.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('get')
  getPoints(@CurrentUser('id') userId: string) {
    return this.pointsService.getPoints(userId);
  }

  @Post('use')
  usePoints(
    @CurrentUser('id') userId: string,
    @Body() dto: UsePointsDto,
  ) {
    return this.pointsService.usePoints(userId, dto.points);
  }
}
