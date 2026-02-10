import { IsEnum, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ReviewRequestStatus } from '../review-request.entity';

export class ReviewDecisionDto {
  @IsEnum(ReviewRequestStatus)
  status: ReviewRequestStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  pointsValue?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
