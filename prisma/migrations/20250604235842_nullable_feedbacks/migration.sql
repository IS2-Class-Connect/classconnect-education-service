-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "course_feedback" DROP NOT NULL,
ALTER COLUMN "course_note" DROP NOT NULL,
ALTER COLUMN "student_feedback" DROP NOT NULL,
ALTER COLUMN "student_note" DROP NOT NULL;
