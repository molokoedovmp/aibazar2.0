-- CreateTable
CREATE TABLE "McpResource" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "longDescription" TEXT,
    "author" TEXT,
    "githubUrl" TEXT,
    "websiteUrl" TEXT,
    "resourceType" TEXT NOT NULL,
    "languageName" TEXT,
    "languageSlug" TEXT,
    "languageIcon" TEXT,
    "tags" TEXT[],
    "categoryNames" TEXT[],
    "categorySlugs" TEXT[],
    "rating" DOUBLE PRECISION,
    "downloads" INTEGER,
    "stars" INTEGER,
    "views" INTEGER,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "features" TEXT[],
    "requirements" TEXT[],
    "documentation" TEXT,
    "license" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceCreatedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptResource" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "authorExternalId" TEXT,
    "authorName" TEXT,
    "sourceKind" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceCreatedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillResource" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "author" TEXT,
    "repoUrl" TEXT,
    "stars" INTEGER,
    "sourceLanguage" TEXT,
    "installCommand" TEXT,
    "compatibleAgents" TEXT[],
    "category" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "status" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceCreatedAt" TIMESTAMP(3),
    "sourceUpdatedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoryResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT,
    "repositoryName" TEXT,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "language" TEXT,
    "stars" INTEGER,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePublishedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "McpResource_externalId_key" ON "McpResource"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "McpResource_slug_key" ON "McpResource"("slug");

-- CreateIndex
CREATE INDEX "McpResource_resourceType_idx" ON "McpResource"("resourceType");

-- CreateIndex
CREATE INDEX "McpResource_languageSlug_idx" ON "McpResource"("languageSlug");

-- CreateIndex
CREATE INDEX "McpResource_rating_idx" ON "McpResource"("rating");

-- CreateIndex
CREATE INDEX "McpResource_stars_idx" ON "McpResource"("stars");

-- CreateIndex
CREATE INDEX "McpResource_isActive_idx" ON "McpResource"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromptResource_externalId_key" ON "PromptResource"("externalId");

-- CreateIndex
CREATE INDEX "PromptResource_sourceKind_idx" ON "PromptResource"("sourceKind");

-- CreateIndex
CREATE INDEX "PromptResource_rating_idx" ON "PromptResource"("rating");

-- CreateIndex
CREATE INDEX "PromptResource_isActive_idx" ON "PromptResource"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SkillResource_externalId_key" ON "SkillResource"("externalId");

-- CreateIndex
CREATE INDEX "SkillResource_category_idx" ON "SkillResource"("category");

-- CreateIndex
CREATE INDEX "SkillResource_stars_idx" ON "SkillResource"("stars");

-- CreateIndex
CREATE INDEX "SkillResource_isActive_idx" ON "SkillResource"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryResource_url_key" ON "RepositoryResource"("url");

-- CreateIndex
CREATE INDEX "RepositoryResource_language_idx" ON "RepositoryResource"("language");

-- CreateIndex
CREATE INDEX "RepositoryResource_stars_idx" ON "RepositoryResource"("stars");

-- CreateIndex
CREATE INDEX "RepositoryResource_isActive_idx" ON "RepositoryResource"("isActive");
