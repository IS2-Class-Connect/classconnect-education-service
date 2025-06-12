import { OmitType, PartialType } from '@nestjs/mapped-types';
import { AssessmentCreateDto } from './assessment.create.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssessmentUpdateDto extends PartialType(
  OmitType(AssessmentCreateDto, ['type'] as const),
) {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
