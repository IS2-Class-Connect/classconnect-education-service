import { Role } from '@prisma/client';

export class EnrollmentResponseDto {
  role: Role;
  userId: string;
  course: {
    id: number;
    title: string;
  };
}
