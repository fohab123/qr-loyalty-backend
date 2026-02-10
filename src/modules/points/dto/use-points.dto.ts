import { IsInt, Min } from 'class-validator';

export class UsePointsDto {
  @IsInt()
  @Min(1)
  points: number;
}
