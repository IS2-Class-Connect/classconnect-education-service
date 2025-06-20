export interface SubmittedAnswer {
  answer: string;
  correction: string;
}

export interface Submission {
  answers: SubmittedAnswer[];
  note?: number;
  feedback?: string;
  AIFeedback?: string;
  submittedAt: Date;
  correctedAt?: Date;
}
