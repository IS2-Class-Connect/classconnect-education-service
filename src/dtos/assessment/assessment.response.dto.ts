import { Assessment } from 'src/schema/assessment.schema';

export interface AssessmentResponseDto extends Omit<Assessment, 'submissions'> {}
