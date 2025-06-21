import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SubmissionCreateDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsArray()
  answers: string[];
}
