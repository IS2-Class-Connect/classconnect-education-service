import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CourseModuleCreateDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsInt()
  order: number;

  @IsNotEmpty()
  userId: string;
}
