import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateReviewRequestDto {
  @IsUUID()
  productId: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
