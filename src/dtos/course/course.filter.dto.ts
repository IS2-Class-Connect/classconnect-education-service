import { IsDateString, IsOptional } from 'class-validator';

export class CourseFilterDto {
  @IsOptional()
  teacherId?: string;

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
