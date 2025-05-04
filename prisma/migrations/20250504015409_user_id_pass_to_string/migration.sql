/*
  Warnings:

  - The primary key for the `Enrollment` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_pkey",
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("course_id", "user_id");
