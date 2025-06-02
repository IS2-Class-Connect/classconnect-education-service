import { DataType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CourseResourceCreateDto {
  @IsNotEmpty()
  @IsString()
  link: string;

  @IsNotEmpty()
  @IsEnum(DataType, {
    message: `Data type must be one of the following values: ${Object.values(DataType).join(', ')}.`,
  })
  dataType: DataType;

  @IsNotEmpty()
  @IsInt()
  order: number;

  @IsNotEmpty()
  userId: string;
}
