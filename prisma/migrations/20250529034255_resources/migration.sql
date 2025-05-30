-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('IMAGE', 'VIDEO', 'LINK');

-- CreateTable
CREATE TABLE "Resource" (
    "link" TEXT NOT NULL,
    "data_type" "DataType" NOT NULL,
    "order" INTEGER NOT NULL,
    "module_id" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("link")
);

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
