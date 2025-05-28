-- CreateTable
CREATE TABLE "Modules" (
    "id" TEXT NOT NULL,
    "course_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Modules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Modules" ADD CONSTRAINT "Modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
