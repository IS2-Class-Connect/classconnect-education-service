-- CreateEnum
CREATE TYPE "Activity" AS ENUM ('EDIT_COURSE', 'ADD_MODULE', 'DELETE_MODULE', 'ADD_EXAM', 'EDIT_EXAM', 'DELETE_EXAM', 'GRADE_EXAM', 'ADD_TASK', 'EDIT_TASK', 'DELETE_TASK', 'GRADE_TASK');

-- CreateTable
CREATE TABLE "ActivityRegister" (
    "id" TEXT NOT NULL,
    "course_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity" "Activity" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityRegister_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActivityRegister" ADD CONSTRAINT "ActivityRegister_course_id_user_id_fkey" FOREIGN KEY ("course_id", "user_id") REFERENCES "Enrollment"("course_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
