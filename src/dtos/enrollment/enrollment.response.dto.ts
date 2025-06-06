import { Role } from '@prisma/client';

export interface EnrollmentResponseDto {
  courseId: number;
  userId: string;
  role: Role;
  favorite: boolean;
}
