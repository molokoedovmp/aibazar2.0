#!/usr/bin/env tsx

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const rootDir = path.resolve(__dirname, "..");
const selectionPath = path.join(rootDir, "data", "external-prompt-selection.json");
const promptsChatCsvUrl = "https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv";
const promptsChatSourceUrl = "https://github.com/f/prompts.chat/blob/main/prompts.csv";
const fabricRawBase = "https://raw.githubusercontent.com/danielmiessler/Fabric/main/data/patterns";
const externalSources = ["prompts-chat", "fabric"];

type SelectionItem = {
  key: string;
  titleRu: string;
  descriptionRu: string;
  category: string;
  tags: string[];
};

type SelectionFile = {
  promptsChat: SelectionItem[];
  fabric: SelectionItem[];
};

type CsvRecord = Record<string, string>;

type ImportedPrompt = {
  externalId: string;
  title: string;
  titleRu: string;
  descriptionRu: string;
  content: string;
  tags: string[];
  authorExternalId: string | null;
  authorName: string | null;
  category: string;
  source: "prompts-chat" | "fabric";
  sourceUrl: string;
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

function readSelection(): SelectionFile {
  const parsed = JSON.parse(fs.readFileSync(selectionPath, "utf8")) as Partial<SelectionFile>;
  if (!Array.isArray(parsed.promptsChat) || !Array.isArray(parsed.fabric)) {
    throw new Error("External prompt selection must contain promptsChat and fabric arrays");
  }

  const keys = [...parsed.promptsChat.map((item) => `prompts-chat:${item.key}`), ...parsed.fabric.map((item) => `fabric:${item.key}`)];
  if (new Set(keys).size !== keys.length) throw new Error("External prompt selection contains duplicate keys");
  return parsed as SelectionFile;
}

async function fetchText(url: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "AI-Bazar-Prompt-Sync/1.0" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 700));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function parseCsv(input: string): CsvRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows[0].map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, "") : header));
  return rows.slice(1).filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])),
  );
}

function externalId(source: string, key: string) {
  return `${source}:${crypto.createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
}

async function importPromptsChat(selection: SelectionItem[]): Promise<ImportedPrompt[]> {
  const rows = parseCsv(await fetchText(promptsChatCsvUrl));
  const byTitle = new Map<string, CsvRecord>();
  for (const row of rows) {
    const title = row.act?.trim();
    if (title && !byTitle.has(title)) byTitle.set(title, row);
  }

  return selection.map((item) => {
    const source = byTitle.get(item.key);
    if (!source?.prompt?.trim()) throw new Error(`Selected prompts.chat prompt is missing: ${item.key}`);
    const contributor = source.contributor?.trim() || null;
    return {
      externalId: externalId("prompts-chat", item.key),
      title: item.key,
      titleRu: item.titleRu,
      descriptionRu: item.descriptionRu,
      content: source.prompt.trim(),
      tags: [...new Set([...item.tags, source.type?.toLowerCase(), source.for_devs === "TRUE" ? "для разработчиков" : null, "CC0"].filter((tag): tag is string => Boolean(tag)))],
      authorExternalId: contributor,
      authorName: contributor,
      category: item.category,
      source: "prompts-chat",
      sourceUrl: promptsChatSourceUrl,
    };
  });
}

async function importFabric(selection: SelectionItem[]): Promise<ImportedPrompt[]> {
  const imported: ImportedPrompt[] = [];
  for (let offset = 0; offset < selection.length; offset += 6) {
    const batch = await Promise.all(
      selection.slice(offset, offset + 6).map(async (item) => {
        const sourceUrl = `https://github.com/danielmiessler/Fabric/tree/main/data/patterns/${item.key}`;
        const content = (await fetchText(`${fabricRawBase}/${item.key}/system.md`)).trim();
        if (!content) throw new Error(`Selected Fabric pattern is empty: ${item.key}`);
        return {
          externalId: externalId("fabric", item.key),
          title: item.key,
          titleRu: item.titleRu,
          descriptionRu: item.descriptionRu,
          content,
          tags: [...new Set([...item.tags, "Fabric", "MIT"])],
          authorExternalId: "danielmiessler",
          authorName: "Daniel Miessler / Fabric",
          category: item.category,
          source: "fabric" as const,
          sourceUrl,
        };
      }),
    );
    imported.push(...batch);
  }
  return imported;
}

export async function syncExternalPrompts(prisma: PrismaClient) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const selection = readSelection();
  const [promptsChat, fabric] = await Promise.all([
    importPromptsChat(selection.promptsChat),
    importFabric(selection.fabric),
  ]);
  const prompts = [...promptsChat, ...fabric];
  const expectedIds = prompts.map((prompt) => prompt.externalId);
  const obsolete = await prisma.promptResource.findMany({
    where: { source: { in: externalSources }, externalId: { notIn: expectedIds } },
    select: { id: true },
  });
  const obsoleteIds = obsolete.map((prompt) => prompt.id);
  const syncedAt = new Date();

  await prisma.$transaction([
    prisma.libraryFavorite.deleteMany({
      where: { itemType: "prompts", itemId: { in: obsoleteIds } },
    }),
    prisma.promptResource.deleteMany({
      where: { source: { in: externalSources }, externalId: { notIn: expectedIds } },
    }),
    ...prompts.map((prompt) =>
      prisma.promptResource.upsert({
        where: { externalId: prompt.externalId },
        create: {
          externalId: prompt.externalId,
          title: prompt.title,
          titleRu: prompt.titleRu,
          description: prompt.descriptionRu,
          descriptionRu: prompt.descriptionRu,
          content: prompt.content,
          tags: prompt.tags,
          authorExternalId: prompt.authorExternalId,
          authorName: prompt.authorName,
          sourceKind: prompt.category,
          rating: 8,
          votesCount: 0,
          isPublic: true,
          status: "published",
          source: prompt.source,
          sourceUrl: prompt.sourceUrl,
          syncedAt,
          isActive: true,
        },
        update: {
          title: prompt.title,
          titleRu: prompt.titleRu,
          description: prompt.descriptionRu,
          descriptionRu: prompt.descriptionRu,
          content: prompt.content,
          tags: prompt.tags,
          authorExternalId: prompt.authorExternalId,
          authorName: prompt.authorName,
          sourceKind: prompt.category,
          rating: 8,
          isPublic: true,
          status: "published",
          source: prompt.source,
          sourceUrl: prompt.sourceUrl,
          syncedAt,
          isActive: true,
        },
      }),
    ),
  ]);

  console.log(
    `External prompts synchronized: ${promptsChat.length} prompts.chat, ${fabric.length} Fabric; removed: ${obsoleteIds.length}.`,
  );
}

if (require.main === module) {
  loadEnv();
  const prisma = new PrismaClient();
  syncExternalPrompts(prisma)
    .catch((error) => {
      console.error("External prompt synchronization failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
