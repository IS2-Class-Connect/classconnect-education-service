import { IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class EnrollmentFilterDto {
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
