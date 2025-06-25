import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CourseQueryDto {
  @IsOptional()
  teacherId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit = 10;

  @IsOptional()
  @IsDateString()
  startDateGt?: string;

  @IsOptional()
  @IsDateString()
  startDateLt?: string;

  @IsOptional()
  @IsDateString()
  endDateGt?: string;

  @IsOptional()
  @IsDateString()
  endDateLt?: string;
}
