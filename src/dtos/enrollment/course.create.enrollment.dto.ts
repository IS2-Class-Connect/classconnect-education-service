import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CourseCreateEnrollmentDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsEnum(Role, {
    message: `Role must be one of the following values: ${Object.values(Role).join(', ')}.`,
  })
  @IsNotEmpty()
  role: Role;
}
