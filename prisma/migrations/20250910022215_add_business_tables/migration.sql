-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "parentDocument" TEXT,
    "content" TEXT,
    "coverImage" TEXT,
    "views" INTEGER DEFAULT 0,
    "previewText" TEXT,
    "readTime" INTEGER,
    "icon" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "icon" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiTool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT,
    "url" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "startPrice" DOUBLE PRECISION,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeedbackMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "service" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "url" TEXT,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiToolOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceName" TEXT,
    "serviceCover" TEXT,

    CONSTRAINT "AiToolOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiGadget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "coverImage" TEXT,
    "features" TEXT[],
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGadget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "usedCredits" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditUsageHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CreditUsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "paymentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "public"."Document"("userId");

-- CreateIndex
CREATE INDEX "Document_userId_parentDocument_idx" ON "public"."Document"("userId", "parentDocument");

-- CreateIndex
CREATE INDEX "AiTool_categoryId_idx" ON "public"."AiTool"("categoryId");

-- CreateIndex
CREATE INDEX "AiTool_rating_idx" ON "public"."AiTool"("rating");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "public"."Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_userId_itemId_idx" ON "public"."Favorite"("userId", "itemId");

-- CreateIndex
CREATE INDEX "Favorite_userId_itemId_itemType_idx" ON "public"."Favorite"("userId", "itemId", "itemType");

-- CreateIndex
CREATE INDEX "FeedbackMessage_email_idx" ON "public"."FeedbackMessage"("email");

-- CreateIndex
CREATE INDEX "Review_documentId_idx" ON "public"."Review"("documentId");

-- CreateIndex
CREATE INDEX "Service_title_idx" ON "public"."Service"("title");

-- CreateIndex
CREATE INDEX "Service_price_idx" ON "public"."Service"("price");

-- CreateIndex
CREATE INDEX "AiToolOrder_userId_idx" ON "public"."AiToolOrder"("userId");

-- CreateIndex
CREATE INDEX "AiToolOrder_status_idx" ON "public"."AiToolOrder"("status");

-- CreateIndex
CREATE INDEX "AiGadget_category_idx" ON "public"."AiGadget"("category");

-- CreateIndex
CREATE INDEX "AiGadget_status_idx" ON "public"."AiGadget"("status");

-- CreateIndex
CREATE INDEX "UserCredit_userId_idx" ON "public"."UserCredit"("userId");

-- CreateIndex
CREATE INDEX "CreditUsageHistory_userId_idx" ON "public"."CreditUsageHistory"("userId");

-- CreateIndex
CREATE INDEX "CreditUsageHistory_userId_service_idx" ON "public"."CreditUsageHistory"("userId", "service");

-- CreateIndex
CREATE INDEX "CreditPurchase_userId_idx" ON "public"."CreditPurchase"("userId");

-- CreateIndex
CREATE INDEX "CreditPurchase_status_idx" ON "public"."CreditPurchase"("status");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiTool" ADD CONSTRAINT "AiTool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."AiTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiToolOrder" ADD CONSTRAINT "AiToolOrder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."AiTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
