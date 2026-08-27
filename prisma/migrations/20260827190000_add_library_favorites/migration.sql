CREATE TABLE "public"."LibraryFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LibraryFavorite_userId_itemId_itemType_key"
ON "public"."LibraryFavorite"("userId", "itemId", "itemType");

CREATE INDEX "LibraryFavorite_userId_idx"
ON "public"."LibraryFavorite"("userId");

CREATE INDEX "LibraryFavorite_userId_itemType_idx"
ON "public"."LibraryFavorite"("userId", "itemType");
