/*
  Warnings:

  - Added the required column `course_feedback` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_note` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_feedback` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_note` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "course_feedback" TEXT NOT NULL,
ADD COLUMN     "course_note" INTEGER NOT NULL,
ADD COLUMN     "student_feedback" TEXT NOT NULL,
ADD COLUMN     "student_note" INTEGER NOT NULL;
