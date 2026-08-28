#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const rootDir = path.resolve(__dirname, "..");
const promptsPath = path.join(rootDir, "data", "curated-prompts.json");

type CuratedPrompt = {
  externalId: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  sourceKind: string;
  rating: number;
};

function loadEnv() {
  for (const fileName of [".env.local", ".env", ".env.production"]) {
    const filePath = path.join(rootDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) process.env[key] = value;
    }
  }
}

function readPrompts() {
  const parsed: unknown = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
  if (!Array.isArray(parsed) || !parsed.length) throw new Error("Curated prompts file is empty");
  return parsed as CuratedPrompt[];
}

export async function syncCuratedPrompts(prisma: PrismaClient) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");

  const prompts = readPrompts();
  const externalIds = prompts.map((prompt) => prompt.externalId);
  const obsoletePrompts = await prisma.promptResource.findMany({
    where: { source: "aibazar-curated", externalId: { notIn: externalIds } },
    select: { id: true },
  });
  const obsoleteIds = obsoletePrompts.map((prompt) => prompt.id);
  const syncedAt = new Date();

  await prisma.$transaction([
    prisma.libraryFavorite.deleteMany({
      where: { itemType: "prompts", itemId: { in: obsoleteIds } },
    }),
    prisma.promptResource.deleteMany({
      where: { source: "aibazar-curated", externalId: { notIn: externalIds } },
    }),
    ...prompts.map((prompt) =>
      prisma.promptResource.upsert({
        where: { externalId: prompt.externalId },
        create: {
          externalId: prompt.externalId,
          title: prompt.title,
          titleRu: prompt.title,
          description: prompt.description,
          descriptionRu: prompt.description,
          content: prompt.content,
          tags: prompt.tags,
          authorExternalId: "aibazar",
          authorName: "AI Bazar",
          sourceKind: prompt.sourceKind,
          rating: prompt.rating,
          votesCount: 0,
          isPublic: true,
          status: "published",
          source: "aibazar-curated",
          sourceUrl: "https://www.ai-bazar.ru/catalog?type=prompts",
          syncedAt,
          isActive: true,
        },
        update: {
          title: prompt.title,
          titleRu: prompt.title,
          description: prompt.description,
          descriptionRu: prompt.description,
          content: prompt.content,
          tags: prompt.tags,
          authorExternalId: "aibazar",
          authorName: "AI Bazar",
          sourceKind: prompt.sourceKind,
          rating: prompt.rating,
          isPublic: true,
          status: "published",
          source: "aibazar-curated",
          sourceUrl: "https://www.ai-bazar.ru/catalog?type=prompts",
          syncedAt,
          isActive: true,
        },
      }),
    ),
  ]);

  console.log(`Curated prompts synchronized: ${prompts.length}; removed: ${obsoleteIds.length}.`);
}

if (require.main === module) {
  loadEnv();
  const prisma = new PrismaClient();
  syncCuratedPrompts(prisma)
    .catch((error) => {
      console.error("Curated prompts synchronization failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
