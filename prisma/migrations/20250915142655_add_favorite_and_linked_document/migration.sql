-- AlterTable
ALTER TABLE "public"."AiTool" ADD COLUMN     "linkedDocumentId" TEXT;

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "AiTool_linkedDocumentId_idx" ON "public"."AiTool"("linkedDocumentId");

-- AddForeignKey
ALTER TABLE "public"."AiTool" ADD CONSTRAINT "AiTool_linkedDocumentId_fkey" FOREIGN KEY ("linkedDocumentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
