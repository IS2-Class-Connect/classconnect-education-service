import { Submission } from 'src/schema/submission.schema';

export interface SubmissionResponseDto extends Submission {
  userId: string;
  assessmentId: string;
}
