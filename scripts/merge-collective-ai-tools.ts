#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  categoryDefinitionFor,
  categoryDescription,
  categoryIconDataUrl,
  categoryIdFor,
} from "./catalog-category-taxonomy";

const SOURCE_URL =
  "https://raw.githubusercontent.com/hanishrao/collective-ai-tools/main/README.md";
const EXPORT_DIR = path.resolve(process.cwd(), "data", "db-export");
const AI_TOOLS_PATH = path.join(EXPORT_DIR, "AiTool.json");
const CATEGORIES_PATH = path.join(EXPORT_DIR, "Category.json");

type JsonRecord = Record<string, unknown>;

type ParsedTool = {
  name: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
};

function stableId(prefix: string, value: string): string {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 24);
  return `${prefix}_${digest}`;
}

function normalizeName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ");
}

function normalizeUrl(value: unknown): string | null {
  const raw = String(value ?? "")
    .trim()
    .split(/\s+/)[0]
    .replace(/[),.;]+$/, "");

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    url.hash = "";
    url.hostname = url.hostname.toLocaleLowerCase("en-US").replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|ref_|source$|source_)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function cleanSourceUrl(value: unknown): string | null {
  const raw = String(value ?? "")
    .trim()
    .split(/\s+/)[0]
    .replace(/[),.;]+$/, "");

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function decodeMarkdownText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCatalog(markdown: string): {
  tools: ParsedTool[];
  invalidUrls: number;
} {
  const tools: ParsedTool[] = [];
  let category = "";
  let invalidUrls = 0;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      category = decodeMarkdownText(heading[1]);
      continue;
    }

    if (!category || category === "Pricing" || category === "Table of Contents") {
      continue;
    }

    const entry = line.match(/^\s*[-*]\s+\[([^\]]+)]\((.+)\)\s+-\s+(.+?)\s*$/);
    if (!entry) continue;

    const url = cleanSourceUrl(entry[2]);
    if (!url) {
      invalidUrls += 1;
      continue;
    }

    const tags = [...entry[3].matchAll(/`#([^`]+)`/g)].map((match) =>
      match[1].trim().toLocaleLowerCase("en-US"),
    );
    const description = decodeMarkdownText(
      entry[3].replace(/\s*`#[^`]+`/g, "").replace(/\s+%20AI%20Tool\)?$/i, ""),
    );

    tools.push({
      name: decodeMarkdownText(entry[1]),
      url,
      description,
      category,
      tags,
    });
  }

  return { tools, invalidUrls };
}

function pricingType(tags: string[]): string {
  if (tags.includes("freemium")) return "freemium";
  if (tags.includes("paid")) return "paid";
  if (tags.includes("free")) return "free";
  if (tags.includes("opensource")) return "opensource";
  return "other";
}

async function readJsonArray(filePath: string): Promise<JsonRecord[]> {
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${filePath} must contain a JSON array`);
  return parsed as JsonRecord[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "aibazar-catalog-importer/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to download catalog: HTTP ${response.status}`);
  }

  const sourceMarkdown = await response.text();
  const { tools: parsedTools, invalidUrls } = parseCatalog(sourceMarkdown);
  const existingTools = await readJsonArray(AI_TOOLS_PATH);
  const existingCategories = await readJsonArray(CATEGORIES_PATH);

  const knownNames = new Set(existingTools.map((tool) => normalizeName(tool.name)).filter(Boolean));
  const knownUrls = new Set(
    existingTools.map((tool) => normalizeUrl(tool.url)).filter((url): url is string => Boolean(url)),
  );
  const categoryById = new Map(existingCategories.map((category) => [String(category.id), category]));

  const now = new Date().toISOString();
  const addedTools: JsonRecord[] = [];
  const addedCategories: JsonRecord[] = [];
  let duplicateCount = 0;

  for (const sourceTool of parsedTools) {
    const normalizedName = normalizeName(sourceTool.name);
    const normalizedUrl = normalizeUrl(sourceTool.url);
    if (!normalizedName || !normalizedUrl) continue;

    if (knownNames.has(normalizedName) || knownUrls.has(normalizedUrl)) {
      duplicateCount += 1;
      continue;
    }

    const definition = categoryDefinitionFor(sourceTool.category);
    const normalizedCategory = normalizeName(sourceTool.category);
    const categoryId = definition
      ? categoryIdFor(definition)
      : stableId("cat_collective", normalizedCategory);
    let categoryRecord = categoryById.get(categoryId);
    if (!categoryRecord) {
      categoryRecord = {
        id: categoryId,
        icon: definition ? categoryIconDataUrl(definition) : null,
        name: definition?.name ?? sourceTool.category,
        description: definition
          ? categoryDescription(definition)
          : `Imported from collective-ai-tools: ${sourceTool.category}`,
        createdAt: now,
        updatedAt: now,
      };
      categoryById.set(categoryId, categoryRecord);
      addedCategories.push(categoryRecord);
    }

    addedTools.push({
      id: stableId("tool_collective", normalizedUrl),
      name: sourceTool.name,
      description: sourceTool.description,
      coverImage: null,
      url: sourceTool.url,
      type: pricingType(sourceTool.tags),
      isActive: true,
      rating: null,
      price: null,
      startPrice: sourceTool.tags.includes("free") ? 0 : null,
      categoryId: categoryRecord.id,
      createdAt: now,
      updatedAt: now,
      linkedDocumentId: null,
    });

    knownNames.add(normalizedName);
    knownUrls.add(normalizedUrl);
  }

  const summary = {
    sourceEntries: parsedTools.length,
    invalidUrls,
    existingTools: existingTools.length,
    duplicatesSkipped: duplicateCount,
    toolsAdded: addedTools.length,
    categoriesAdded: addedCategories.length,
    resultTools: existingTools.length + addedTools.length,
    resultCategories: existingCategories.length + addedCategories.length,
    dryRun,
  };

  if (!dryRun) {
    const backupSuffix = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.copyFile(AI_TOOLS_PATH, `${AI_TOOLS_PATH}.${backupSuffix}.bak`);
    await fs.copyFile(CATEGORIES_PATH, `${CATEGORIES_PATH}.${backupSuffix}.bak`);
    await fs.writeFile(
      AI_TOOLS_PATH,
      `${JSON.stringify([...existingTools, ...addedTools], null, 2)}\n`,
      "utf8",
    );
    await fs.writeFile(
      CATEGORIES_PATH,
      `${JSON.stringify([...existingCategories, ...addedCategories], null, 2)}\n`,
      "utf8",
    );
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
