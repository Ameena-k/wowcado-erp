-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "stateCode" TEXT;

-- AlterTable
ALTER TABLE "SupplierBill" ADD COLUMN     "itcEligible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reverseCharge" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "stateCode" TEXT;
