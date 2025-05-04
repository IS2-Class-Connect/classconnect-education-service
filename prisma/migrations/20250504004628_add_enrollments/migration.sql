-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Enrollment" (
    "course_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "favorite" BOOLEAN NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("course_id","user_id")
);

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
