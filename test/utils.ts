import { PrismaClient } from '@prisma/client';
import { Connection } from 'mongoose';

export const COURSE_ID = 1;
export const TEACHER_ID = 't1';
export const USER_ID = 'u1';
export const FORBIDDEN_USER_ID = 'u2';
export const ASSES_ID = 'a1'; // WARNING: this is not a valid ObjectId, but used for testing purposes
export const MOCK_AI_RESPONSE = 'Mocked AI response';

/**
 * Get dates that are beyond the current date, useful to add a new course
 * that must respect the dates rules.
 * @returns An object containing dates that are beyond the current date.
 */
export function getDatesAfterToday(): {
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  deadline: Date;
} {
  // so that it don't fail when validating that dates are beyond current date
  const now = new Date();
  const startDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after now
  const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after now
  const registrationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day after now
  const deadline = new Date(now.getTime() + 2 * 25 * 60 * 60 * 1000); // 1 day and an hour after now
  return { startDate, endDate, registrationDeadline, deadline };
}

export async function cleanDataBase(prisma: PrismaClient) {
  await prisma.$transaction([
    // IMPORTANT: respect order by FK relation in case it dont't use 'CASCADE'
    prisma.activityRegister.deleteMany(),
    prisma.course.deleteMany(),
  ]);
}

export async function cleanMongoDatabase(connection: Connection) {
  const collections = Object.keys(connection.collections);
  for (const collectionName of collections) {
    const collection = connection.collections[collectionName];
    await collection.deleteMany({});
  }
}
