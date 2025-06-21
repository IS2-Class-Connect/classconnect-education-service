import { IsArray, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CorrectionCreateDto {
  @IsNotEmpty()
  @IsString()
  teacherId: string;

  @IsNotEmpty()
  @IsArray()
  corrections: string[];

  @IsNotEmpty()
  @IsString()
  feedback: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  note: number;
}
