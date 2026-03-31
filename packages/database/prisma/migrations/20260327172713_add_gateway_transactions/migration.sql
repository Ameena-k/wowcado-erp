-- CreateEnum
CREATE TYPE "GatewayEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'DUPLICATE', 'IGNORED', 'FAILED');

-- CreateTable
CREATE TABLE "GatewayTransaction" (
    "id" UUID NOT NULL,
    "razorpayEventId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "eventType" TEXT NOT NULL,
    "status" "GatewayEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "rawPayload" JSONB NOT NULL,
    "processingError" TEXT,
    "customerPaymentId" UUID,
    "invoiceId" UUID,
    "amountPaise" INTEGER,
    "amountInr" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'INR',
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewayTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GatewayTransaction_razorpayEventId_key" ON "GatewayTransaction"("razorpayEventId");
