#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { categoryDefinitionFor, categoryIdFor } from "./catalog-category-taxonomy";

const ROOT_DIR = path.resolve(__dirname, "..");
const EXPORT_DIR = path.join(ROOT_DIR, "data", "db-export");

function loadEnv() {
  const candidates = [".env.local", ".env", ".env.production"].map((fileName) =>
    path.join(ROOT_DIR, fileName),
  );

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const isLocalEnv = candidate.endsWith(".env.local");

    for (const line of fs.readFileSync(candidate, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      if (!key || (!isLocalEnv && process.env[key])) continue;
      process.env[key] = rawValue.replace(/^["'](.+)["']$/, "$1");
    }
  }
}

function readJson<T>(fileName: string): T[] {
  return JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, fileName), "utf8")) as T[];
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

const target = new URL(databaseUrl);
const prisma = new PrismaClient();

type CatalogCategory = Prisma.CategoryCreateManyInput & { id: string };
type CatalogTool = Prisma.AiToolCreateManyInput & { id: string; categoryId: string };

async function main() {
  const categories = readJson<CatalogCategory>("Category.json");
  const tools = readJson<CatalogTool>("AiTool.json").map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    coverImage: tool.coverImage,
    url: tool.url,
    type: tool.type,
    isActive: tool.isActive,
    rating: tool.rating,
    price: tool.price,
    startPrice: tool.startPrice,
    categoryId: tool.categoryId,
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
  })) as CatalogTool[];

  console.log(
    `Catalog database target: ${target.hostname}:${target.port || "5432"}${target.pathname}`,
  );

  const existingCategoryIds = new Set(
    (
      await prisma.category.findMany({
        where: { id: { in: categories.map((category) => category.id) } },
        select: { id: true },
      })
    ).map((category) => category.id),
  );
  const addedCategories = categories.filter((category) => !existingCategoryIds.has(category.id)).length;

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: category,
      update: {
        name: category.name,
        icon: category.icon,
        description: category.description,
        updatedAt: category.updatedAt,
      },
    });
  }

  const existingToolIds = new Set(
    (
      await prisma.aiTool.findMany({
        where: { id: { in: tools.map((tool) => tool.id) } },
        select: { id: true },
      })
    ).map((tool) => tool.id),
  );
  const addedTools = tools.filter((tool) => !existingToolIds.has(tool.id)).length;

  for (let offset = 0; offset < tools.length; offset += 25) {
    const batch = tools.slice(offset, offset + 25);
    await prisma.$transaction(
      batch.map((tool) =>
        prisma.aiTool.upsert({
          where: { id: tool.id },
          create: tool,
          update: {
            name: tool.name,
            description: tool.description,
            coverImage: tool.coverImage,
            url: tool.url,
            type: tool.type,
            isActive: tool.isActive,
            rating: tool.rating,
            price: tool.price,
            startPrice: tool.startPrice,
            categoryId: tool.categoryId,
            updatedAt: tool.updatedAt,
          },
        }),
      ),
    );
  }

  const updatedTools = tools.length - addedTools;
  let categoryAssignments = 0;

  const databaseCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const legacyCategories = databaseCategories
    .map((category) => {
      const definition = categoryDefinitionFor(category.name);
      if (!definition) return null;
      const targetId = categoryIdFor(definition);
      return category.id === targetId ? null : { id: category.id, targetId };
    })
    .filter((category): category is { id: string; targetId: string } => category !== null);

  for (const legacyCategory of legacyCategories) {
    const result = await prisma.aiTool.updateMany({
      where: { categoryId: legacyCategory.id },
      data: { categoryId: legacyCategory.targetId },
    });
    categoryAssignments += result.count;
  }

  const removedCategories = legacyCategories.length
    ? await prisma.category.deleteMany({
        where: { id: { in: legacyCategories.map((category) => category.id) }, aiTools: { none: {} } },
      })
    : { count: 0 };

  console.log(
    [
      "Catalog synchronized:",
      `${addedCategories} categories added,`,
      `${addedTools} tools added,`,
      `${updatedTools} tools updated,`,
      `${categoryAssignments} tools reassigned,`,
      `${removedCategories.count} legacy categories removed.`,
    ].join(" "),
  );
}

main()
  .catch((error) => {
    console.error("Catalog synchronization failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
