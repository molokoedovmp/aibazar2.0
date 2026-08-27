ALTER TABLE "PromptResource"
ADD COLUMN "titleRu" TEXT,
ADD COLUMN "descriptionRu" TEXT;

ALTER TABLE "SkillResource"
ADD COLUMN "descriptionRu" TEXT;

ALTER TABLE "RepositoryResource"
ADD COLUMN "descriptionRu" TEXT;
