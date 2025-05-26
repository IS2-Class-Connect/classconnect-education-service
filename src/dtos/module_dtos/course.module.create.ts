import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

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
  @IsUUID()
  userId: string;
}
