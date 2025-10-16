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
        try {
          return JSON.parse(l);
        } catch (e) {
          console.warn(`Skipping bad JSONL line in ${path.basename(filePath)}:`, l.slice(0, 120));
          return null;
        }
      })
      .filter(Boolean) as AnyObj[];
  }
  // .json — может быть массивом или объектом с полем data/rows
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as AnyObj[];
    if (Array.isArray(parsed?.data)) return parsed.data as AnyObj[];
    if (Array.isArray(parsed?.rows)) return parsed.rows as AnyObj[];
    // если один объект
    return parsed ? [parsed as AnyObj] : [];
  } catch (e) {
    console.error(`Failed to parse JSON: ${filePath}`);
    throw e;
  }
}

function parseDate(v: any): Date | undefined {
  if (!v && v !== 0) return undefined;
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

function normalizeId(obj: AnyObj): string | undefined {
  return (
    toStr(obj.id) ||
    toStr(obj._id) ||
    toStr(obj?._id?.id) ||
    toStr(obj?._id?._id) ||
    toStr(obj?._id?.$id)
  );
}

function normalizeCategory(obj: AnyObj) {
  const id = normalizeId(obj) ?? randomUUID();
  const name = toStr(obj.name) || toStr(obj.title) || "Unnamed";
  const description = toStr(obj.description) ?? toStr(obj.desc) ?? null;
  const icon = toStr(obj.icon) ?? toStr(obj.emoji) ?? null;

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

  return { id, name, description, icon, createdAt, updatedAt };
}

async function importCategoriesFromDir(dir: string) {
  const files = await fs.readdir(dir).catch(() => []);
  const targets = files.filter((f) => f.endsWith(".json") || f.endsWith(".jsonl"));
  if (targets.length === 0) {
    console.log("No JSON/JSONL files found in", dir);
    return;
  }

  let created = 0, updated = 0, skipped = 0, total = 0;

  for (const file of targets) {
    const full = path.join(dir, file);
    const rows = await readJsonOrJsonl(full);
    for (const row of rows) {
      total++;
      const cat = normalizeCategory(row);
      try {
        // upsert по id, fallback по name (если id сгенерирован и запись с таким именем уже есть)
        const exists = await prisma.category.findUnique({ where: { id: cat.id } }).catch(() => null);
        if (exists) {
          await prisma.category.update({ where: { id: cat.id }, data: { ...cat } });
          updated++;
        } else {
          // попытка найти по name
          const byName = await prisma.category.findFirst({ where: { name: cat.name } });
          if (byName) {
            await prisma.category.update({ where: { id: byName.id }, data: { ...cat, id: byName.id } });
            updated++;
          } else {
            await prisma.category.create({ data: cat });
            created++;
          }
        }
      } catch (e) {
        skipped++;
        console.warn("Skip with error:", (e as Error)?.message);
      }
    }
  }

  console.log("\nImport finished:");
  console.log("Total:", total, "Created:", created, "Updated:", updated, "Skipped:", skipped);
}

async function main() {
  const argv = process.argv.slice(2);
  let dir = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) dir = argv[i + 1];
  }
  if (!dir) {
    dir = path.resolve(process.cwd(), "data/convex-import/categories");
  }
  console.log("Importing categories from:", dir);
  await importCategoriesFromDir(dir);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

