import { IsArray, IsNotEmpty } from 'class-validator';

export class SubmissionCreateDto {
  @IsNotEmpty()
  @IsArray()
  answers: string[];
}
