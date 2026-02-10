import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewRequestService } from './review-request.service';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { ReviewRequestStatus } from './review-request.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Controller()
export class ReviewRequestController {
  constructor(
    private readonly reviewRequestService: ReviewRequestService,
  ) {}

  @Post('product/review/request')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewRequestDto,
  ) {
    return this.reviewRequestService.create(userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('review-requests')
  findAll(@Query('status') status?: ReviewRequestStatus) {
    return this.reviewRequestService.findAll(status);
  }

  @Roles(UserRole.ADMIN)
  @Patch('review-requests/:id')
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDecisionDto,
  ) {
    return this.reviewRequestService.decide(id, dto);
  }
}
