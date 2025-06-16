import { OmitType, PartialType } from '@nestjs/mapped-types';
import { AssessmentCreateDto } from './assessment.create.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class AssessmentFilterDto extends PartialType(
  OmitType(AssessmentCreateDto, ['startTime', 'deadline'] as const),
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
}
