import { OmitType, PartialType } from '@nestjs/mapped-types';
import { AssessmentCreateDto } from './assessment.create.dto';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class AssessmentQueryDto extends PartialType(
  OmitType(AssessmentCreateDto, ['startTime', 'deadline', 'exercises'] as const),
) {
  @IsOptional()
  @IsDateString()
  startTimeBegin?: string;

  @IsOptional()
  @IsDateString()
  startTimeEnd?: string;

  @IsOptional()
  @IsDateString()
  deadlineBegin?: string;

  @IsOptional()
  @IsDateString()
  deadlineEnd?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
