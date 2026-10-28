import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
} from 'class-validator';

export class GetDoctorsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
