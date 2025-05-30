/*
  Warnings:

  - The primary key for the `Resource` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_pkey",
ADD CONSTRAINT "Resource_pkey" PRIMARY KEY ("link", "module_id");
