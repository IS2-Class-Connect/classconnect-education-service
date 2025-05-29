import { DataType } from '@prisma/client';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CourseResourceCreateDto {
  @IsNotEmpty()
  @IsString()
  link: string;

  @IsNotEmpty()
  dataType: DataType;

  @IsNotEmpty()
  @IsInt()
  order: number;

  @IsNotEmpty()
  userId: string;
}
