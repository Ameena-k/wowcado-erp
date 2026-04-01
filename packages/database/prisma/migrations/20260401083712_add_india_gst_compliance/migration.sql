/*
  Warnings:

  - You are about to drop the column `addressLine1` on the `CustomerAddress` table. All the data in the column will be lost.
  - You are about to drop the column `addressLine2` on the `CustomerAddress` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `CustomerAddress` table. All the data in the column will be lost.
  - You are about to drop the column `pincode` on the `CustomerAddress` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `CustomerAddress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gstin]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gstin]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blockOrStreet` to the `CustomerAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doorNo` to the `CustomerAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `societyId` to the `CustomerAddress` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('SIMULATED', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "isGstRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pan" TEXT;

-- AlterTable
ALTER TABLE "CustomerAddress" DROP COLUMN "addressLine1",
DROP COLUMN "addressLine2",
DROP COLUMN "city",
DROP COLUMN "pincode",
DROP COLUMN "state",
ADD COLUMN     "blockOrStreet" TEXT NOT NULL,
ADD COLUMN     "doorNo" TEXT NOT NULL,
ADD COLUMN     "societyId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cgstTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "sgstTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "cgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "hsnSacCode" TEXT,
ADD COLUMN     "purchaseAccountId" UUID,
ADD COLUMN     "salesAccountId" UUID,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'GOODS';

-- AlterTable
ALTER TABLE "SupplierBill" ADD COLUMN     "cgstTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "sgstTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SupplierBillItem" ADD COLUMN     "cgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sgstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRateSnapshot" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "isGstRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pan" TEXT;

-- CreateTable
CREATE TABLE "Society" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "areaOrLocality" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Society_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessageLog" (
    "id" UUID NOT NULL,
    "customerId" UUID,
    "phone" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "linkedEntityType" TEXT,
    "linkedEntityId" UUID,
    "payload" JSONB,
    "providerMessageId" TEXT,
    "status" "WhatsappMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Society_name_key" ON "Society"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_gstin_key" ON "Customer"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_gstin_key" ON "Vendor"("gstin");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_salesAccountId_fkey" FOREIGN KEY ("salesAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_purchaseAccountId_fkey" FOREIGN KEY ("purchaseAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessageLog" ADD CONSTRAINT "WhatsappMessageLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
