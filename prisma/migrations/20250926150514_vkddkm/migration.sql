-- CreateTable
CREATE TABLE "public"."UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "company" TEXT,
    "position" TEXT,
    "website" TEXT,
    "location" TEXT,
    "timezone" TEXT DEFAULT 'Europe/Moscow',
    "language" TEXT DEFAULT 'ru',
    "theme" TEXT DEFAULT 'system',
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publicProfile" BOOLEAN NOT NULL DEFAULT true,
    "newsEmails" BOOLEAN NOT NULL DEFAULT false,
    "productEmails" BOOLEAN NOT NULL DEFAULT false,
    "securityEmails" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "public"."UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "public"."UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "public"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
