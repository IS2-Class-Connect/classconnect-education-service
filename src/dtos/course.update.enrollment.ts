import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class CourseUpdateEnrollmentDto {
  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of the following values: ${Object.values(Role).join(', ')}.`,
  })
  role?: Role;
}
