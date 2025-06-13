import { PartialType } from '@nestjs/mapped-types';
import { AssessmentCreateDto } from './assessment.create.dto';

export class AssessmentFilterDto extends PartialType(AssessmentCreateDto) {}
