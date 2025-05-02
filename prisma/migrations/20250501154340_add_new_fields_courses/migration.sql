/*
  Warnings:

  - Added the required column `end_date` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration_deadline` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_places` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "registration_deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "total_places" INTEGER NOT NULL;
