-- CreateTable
CREATE TABLE "public"."UserToolPrice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiToolId" TEXT NOT NULL,
    "startPriceUsd" DOUBLE PRECISION NOT NULL,
    "fx" DOUBLE PRECISION NOT NULL,
    "priceRub" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToolPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserToolPrice_aiToolId_idx" ON "public"."UserToolPrice"("aiToolId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToolPrice_userId_aiToolId_key" ON "public"."UserToolPrice"("userId", "aiToolId");

-- AddForeignKey
ALTER TABLE "public"."UserToolPrice" ADD CONSTRAINT "UserToolPrice_aiToolId_fkey" FOREIGN KEY ("aiToolId") REFERENCES "public"."AiTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
