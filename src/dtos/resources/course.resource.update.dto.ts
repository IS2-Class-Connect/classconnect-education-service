import { IsInt, IsNotEmpty } from 'class-validator';

export class CourseResourceUpdateDto {
  @IsNotEmpty()
  @IsInt()
  order: number;

  @IsNotEmpty()
  userId: string;
}
