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

function toBool(v: any): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (["true", "1", "yes", "y"].includes(s)) return true;
    if (["false", "0", "no", "n"].includes(s)) return false;
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

function getParentIdRaw(obj: AnyObj): string | undefined {
  return (
    toStr(obj.parentDocument) ||
    toStr(obj.parentId) ||
    toStr(obj.parent_id) ||
    toStr(obj.parent) ||
    toStr(obj?.parent?.id) ||
    toStr(obj?.parent?._id) ||
    toStr(obj?.parent?.$id)
  );
}

function normalizeDocument(obj: AnyObj, fallbackUserId: string) {
  const id = normalizeId(obj) ?? randomUUID();
  const title = toStr(obj.title) || toStr(obj.name) || "Без названия";
  const userId = fallbackUserId;
  const isArchived = toBool(obj.isArchived) ?? false;
  const isFavorite = toBool(obj.isFavorite) ?? false;
  const contentVal = obj.content ?? obj.body ?? obj.text ?? null;
  const content = typeof contentVal === "string" ? contentVal : contentVal ? JSON.stringify(contentVal) : null;
  const coverImage = toStr(obj.coverImage) || toStr(obj.cover) || toStr(obj.image) || null;
  const views = toNum(obj.views) ?? 0;
  const previewText = toStr(obj.previewText) || toStr(obj.preview) || null;
  const readTime = toNum(obj.readTime);
  const icon = toStr(obj.icon) || null;
  const isPublished = toBool(obj.isPublished) ?? false;
  const parent = getParentIdRaw(obj);

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
    title,
    userId,
    isArchived,
    isFavorite,
    parentDocument: parent,
    content,
    coverImage,
    views,
    previewText,
    readTime,
    icon,
    isPublished,
    createdAt,
    updatedAt,
  };
}

async function ensureUser(userId: string) {
  const exists = await prisma.user.findUnique({ where: { id: userId } });
  if (exists) return exists.id;
  await prisma.user.create({ data: { id: userId, name: "Imported User", email: null } as any });
  return userId;
}

async function importDocumentsFromDir(dir: string, userId: string) {
  await ensureUser(userId);

  const files = await fs.readdir(dir).catch(() => []);
  const targets = files.filter((f) => f.endsWith(".json") || f.endsWith(".jsonl"));
  if (targets.length === 0) {
    console.log("No JSON/JSONL files found in", dir);
    return;
  }

  let created = 0, updated = 0, skipped = 0, total = 0;

  // Первый проход — создаём/обновляем без связей родителя
  for (const file of targets) {
    const full = path.join(dir, file);
    const rows = await readJsonOrJsonl(full);
    for (const row of rows) {
      total++;
      const doc = normalizeDocument(row, userId);
      try {
        const exists = await prisma.document.findUnique({ where: { id: doc.id } }).catch(() => null);
        const data = { ...doc, parentDocument: null };
        if (exists) {
          await prisma.document.update({ where: { id: doc.id }, data });
          updated++;
        } else {
          await prisma.document.create({ data });
          created++;
        }
      } catch (e) {
        skipped++;
        console.warn("Skip with error:", (e as Error)?.message);
      }
    }
  }

  // Второй проход — ставим parentDocument, если родитель существует
  for (const file of targets) {
    const full = path.join(dir, file);
    const rows = await readJsonOrJsonl(full);
    for (const row of rows) {
      const doc = normalizeDocument(row, userId);
      if (!doc.parentDocument) continue;
      try {
        const parent = await prisma.document.findUnique({ where: { id: doc.parentDocument } });
        if (parent) {
          await prisma.document.update({ where: { id: doc.id }, data: { parentDocument: parent.id } });
        }
      } catch {
        /* ignore */
      }
    }
  }

  console.log("\nImport finished:");
  console.log("Total:", total, "Created:", created, "Updated:", updated, "Skipped:", skipped);
}

async function main() {
  const argv = process.argv.slice(2);
  let dir = "";
  let user = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) dir = argv[i + 1];
    if (argv[i] === "--user" && argv[i + 1]) user = argv[i + 1];
  }
  if (!dir) dir = path.resolve(process.cwd(), "data/convex-import/documents");
  if (!user) {
    user = process.env.IMPORT_DOCS_USER_ID || "";
  }
  if (!user) {
    console.error("Provide user id via --user or env IMPORT_DOCS_USER_ID");
    process.exit(1);
  }
  console.log("Importing documents from:", dir, "as user:", user);
  await importDocumentsFromDir(dir, user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

