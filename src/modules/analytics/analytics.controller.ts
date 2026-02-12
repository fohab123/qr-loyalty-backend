import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Roles(UserRole.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('products-by-store')
  getProductsByStore(@Query('top') top?: string) {
    return this.analyticsService.getProductsByStore(top === 'true');
  }

  @Get('top-stores')
  getTopStores() {
    return this.analyticsService.getTopStores();
  }

  @Get('user-activity')
  getUserActivity(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.analyticsService.getUserActivity(period);
  }

  @Get('new-products')
  getNewProducts(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.analyticsService.getNewProducts(period);
  }
}
