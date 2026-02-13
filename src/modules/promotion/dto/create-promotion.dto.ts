import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { PromotionStatus } from '../promotion.entity';

export class CreatePromotionDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @IsUUID()
  storeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(PromotionStatus)
  @IsOptional()
  status?: PromotionStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  minPointsRequired?: number;
}
