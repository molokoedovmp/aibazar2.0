#!/usr/bin/env tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

type AnyObj = Record<string, any>;

const prisma = new PrismaClient();

async function readJsonOrJsonl(filePath: string): Promise<AnyObj[]> {
  const raw = await fs.readFile(filePath, "utf8");
  if (filePath.endsWith(".jsonl")) {
    return raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        try { return JSON.parse(l); } catch { return null as any; }
      })
      .filter(Boolean) as AnyObj[];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as AnyObj[];
    if (Array.isArray((parsed as any)?.data)) return (parsed as any).data as AnyObj[];
    if (Array.isArray((parsed as any)?.rows)) return (parsed as any).rows as AnyObj[];
    return parsed ? [parsed as AnyObj] : [];
  } catch (e) {
    console.error(`Failed to parse JSON: ${filePath}`);
    throw e;
  }
}

function parseDate(v: any): Date | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.valueOf())) return d;
  }
  return undefined;
}

function toStr(v: any): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string") return v;
  try { return String(v); } catch { return undefined; }
}

function toNum(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace?.(/[^0-9.,-]/g, "").replace(",", ".") ?? v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeId(obj: AnyObj): string | undefined {
  return (
    toStr(obj.id) ||
    toStr(obj._id) ||
    toStr(obj?._id?.id) ||
    toStr(obj?._id?._id) ||
    toStr(obj?._id?.$id)
  );
}

async function ensureCategoryId(obj: AnyObj): Promise<string> {
  const directId = toStr(obj.categoryId) || toStr(obj.category_id) || toStr(obj.categoryID);
  if (directId) {
    const existing = await prisma.category.findUnique({ where: { id: directId } }).catch(() => null);
    if (existing) return existing.id;
  }

  const catObj = obj.category || obj.cat || {};
  const fromObjId = toStr(catObj?.id) || toStr(catObj?._id) || toStr(catObj?.value);
  if (fromObjId) {
    const existing = await prisma.category.findUnique({ where: { id: fromObjId } }).catch(() => null);
    if (existing) return existing.id;
  }

  const byName = toStr(obj.categoryName) || toStr(catObj?.name) || toStr(obj.category) || toStr(obj.catName);
  if (byName) {
    const existingByName = await prisma.category.findFirst({ where: { name: byName } });
    if (existingByName) return existingByName.id;
    // создаём категорию, если её нет
    const created = await prisma.category.create({
      data: { id: randomUUID(), name: byName, description: null, icon: null },
      select: { id: true },
    });
    return created.id;
  }

  // fallback — специальная категория «Imported»
  const fallbackName = "Imported";
  const fallback = await prisma.category.findFirst({ where: { name: fallbackName } });
  if (fallback) return fallback.id;
  const created = await prisma.category.create({ data: { id: randomUUID(), name: fallbackName } });
  return created.id;
}

function clampRating(n?: number): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  if (n > 5 && n <= 100) return Math.round((n / 20) * 10) / 10; // если проценты 0..100
  return Math.max(0, Math.min(5, n));
}

function normalizeAiTool(obj: AnyObj) {
  const id = normalizeId(obj) ?? randomUUID();
  const name = toStr(obj.name) || toStr(obj.title) || "Без названия";
  const description = toStr(obj.description) ?? toStr(obj.desc) ?? "";
  const coverImage =
    toStr(obj.coverImage) ||
    toStr(obj.cover) ||
    toStr(obj.image) ||
    toStr(obj.cover_url) ||
    toStr(obj.imageUrl) ||
    undefined;
  const url = toStr(obj.url) || toStr(obj.link) || toStr(obj.href) || undefined;
  const type = toStr(obj.type) || toStr(obj.kind) || "other";
  const isActive = typeof obj.isActive === "boolean" ? obj.isActive : (toStr(obj.status)?.toLowerCase() !== "inactive");
  const rating = clampRating(toNum(obj.rating) ?? toNum(obj.stars));
  const price = toNum(obj.price) ?? toNum(obj.priceRub) ?? toNum(obj.price_rub);
  const startPrice = toNum(obj.startPrice) ?? toNum(obj.start_price_usd) ?? toNum(obj.startPriceUsd);
  const linkedDocumentId = toStr(obj.linkedDocumentId) || toStr(obj.documentId) || undefined;

  const createdAt =
    parseDate(obj.createdAt) ||
    parseDate(obj._creationTime) ||
    parseDate(obj.created_at) ||
    new Date();
  const updatedAt =
    parseDate(obj.updatedAt) ||
    parseDate(obj._updateTime) ||
    parseDate(obj.updated_at) ||
    createdAt;

  return {
    id,
    name,
    description,
    coverImage,
    url,
    type,
    isActive,
    rating,
    price,
    startPrice,
    linkedDocumentId,
    createdAt,
    updatedAt,
  };
}

async function importAiToolsFromDir(dir: string) {
  const files = await fs.readdir(dir).catch(() => []);
  const targets = files.filter((f) => f.endsWith(".json") || f.endsWith(".jsonl"));
  if (targets.length === 0) {
    console.log("No JSON/JSONL files found in", dir);
    return;
  }

  let created = 0, updated = 0, skipped = 0, total = 0, missingCategory = 0;

  for (const file of targets) {
    const full = path.join(dir, file);
    const rows = await readJsonOrJsonl(full);
    for (const row of rows) {
      total++;
      const tool = normalizeAiTool(row);
      try {
        const categoryId = await ensureCategoryId(row);
        // upsert по id, иначе по name
        const exists = await prisma.aiTool.findUnique({ where: { id: tool.id } }).catch(() => null);
        if (exists) {
          await prisma.aiTool.update({ where: { id: tool.id }, data: { ...tool, categoryId } });
          updated++;
        } else {
          const byName = await prisma.aiTool.findFirst({ where: { name: tool.name } });
          if (byName) {
            await prisma.aiTool.update({ where: { id: byName.id }, data: { ...tool, id: byName.id, categoryId } });
            updated++;
          } else {
            await prisma.aiTool.create({ data: { ...tool, categoryId } });
            created++;
          }
        }
      } catch (e) {
        skipped++;
        console.warn("Skip with error:", (e as Error)?.message);
      }
    }
  }

  console.log("\nImport finished:")
  console.log("Total:", total, "Created:", created, "Updated:", updated, "Skipped:", skipped, "MissingCategory:", missingCategory);
}

async function main() {
  const argv = process.argv.slice(2);
  let dir = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) dir = argv[i + 1];
  }
  if (!dir) dir = path.resolve(process.cwd(), "data/convex-import/aitools");
  console.log("Importing ai tools from:", dir);
  await importAiToolsFromDir(dir);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

