import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CourseResourceUpdateDto {
  @IsNotEmpty()
  @IsInt()
  order: number;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
