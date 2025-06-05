import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CourseFeedbackDto {
  @IsNotEmpty()
  @IsString()
  courseFeedback: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  courseNote: number;
}
