-- AlterTable
ALTER TABLE "CustomerPayment" ADD COLUMN     "allocatedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unallocatedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
