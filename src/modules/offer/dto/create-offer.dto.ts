import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { OfferStatus } from '../offer.entity';

export class CreateOfferDto {
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
  userId: string;

  @IsUUID()
  storeId: string;

  @IsUUID()
  @IsOptional()
  promotionId?: string;

  @IsDateString()
  expiresAt: string;

  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;
}
