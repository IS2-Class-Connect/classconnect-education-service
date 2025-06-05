import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class StudentFeedbackDto {
  @IsNotEmpty()
  @IsString()
  studentFeedback: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(10)
  studentNote: number;

  @IsNotEmpty()
  @IsString()
  teacherId: string;
}
