import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class EnrollmentFilterDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
