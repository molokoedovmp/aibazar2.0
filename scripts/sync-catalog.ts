#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

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

async function main() {
  const categories = readJson<Prisma.CategoryCreateManyInput>("Category.json");
  const tools = readJson<Prisma.AiToolCreateManyInput>("AiTool.json").map((tool) => ({
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
  }));

  console.log(
    `Catalog database target: ${target.hostname}:${target.port || "5432"}${target.pathname}`,
  );

  const [categoryResult, toolResult] = await prisma.$transaction(async (transaction) => {
    const createdCategories = await transaction.category.createMany({
      data: categories,
      skipDuplicates: true,
    });
    const createdTools = await transaction.aiTool.createMany({
      data: tools,
      skipDuplicates: true,
    });
    return [createdCategories, createdTools] as const;
  });

  console.log(
    `Catalog synchronized: ${categoryResult.count} categories and ${toolResult.count} tools added.`,
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
