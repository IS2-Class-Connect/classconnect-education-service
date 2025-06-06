import { Role } from '@prisma/client';

export interface CourseEnrollmentDto {
  role: Role;
  userId: string;
  course: {
    id: number;
    title: string;
  };
}
