import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

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
}
