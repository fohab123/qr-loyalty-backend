import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { ProductStatus } from '../product.entity';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  identifier?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  pointsValue?: number;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
