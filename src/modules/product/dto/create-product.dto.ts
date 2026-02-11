import { IsString, IsOptional, IsInt, IsNumber, Min, IsEnum } from 'class-validator';
import { ProductStatus } from '../product.entity';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  identifier?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  pointsValue?: number;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
