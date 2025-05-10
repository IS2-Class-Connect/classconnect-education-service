import { IsBoolean, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CourseUpdateEnrollmentDto {
  @IsBoolean()
  favorite?: boolean;

  @IsEnum(Role, {
    message: `Role must be one of the following values: ${Object.values(Role).join(', ')}.`,
  })
  role?: Role;
}
