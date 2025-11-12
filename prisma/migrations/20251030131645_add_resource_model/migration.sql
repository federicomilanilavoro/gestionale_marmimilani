/*
  Warnings:

  - You are about to drop the column `type` on the `Material` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Customer_email_key";

-- DropIndex
DROP INDEX "public"."Material_name_key";

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "type",
ALTER COLUMN "coeff_mq" SET DEFAULT 0.5,
ALTER COLUMN "coeff_ml" SET DEFAULT 0.2;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "resourceId" INTEGER,
ALTER COLUMN "sqm" DROP NOT NULL,
ALTER COLUMN "ml" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
