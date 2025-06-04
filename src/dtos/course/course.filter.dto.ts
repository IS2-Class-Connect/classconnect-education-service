import { IsOptional } from 'class-validator';

export class CourseFilterDto {
  @IsOptional()
  teacherId?: string;
}
