-- AlterTable
ALTER TABLE "public"."AiToolOrder" ADD COLUMN     "confirmationUrl" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentId" TEXT;
