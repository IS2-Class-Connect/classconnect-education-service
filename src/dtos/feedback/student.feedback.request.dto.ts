import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class StudentFeedbackRequestDto {
  @IsNotEmpty()
  @IsString()
  studentFeedback: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  studentNote: number;

  @IsNotEmpty()
  @IsString()
  teacherId?: string;
}
