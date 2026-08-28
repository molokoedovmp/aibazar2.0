#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE = "collective-ai-tools";
const SOURCE_URL = "https://github.com/hanishrao/collective-ai-tools";
const DEFAULT_API_BASE = "https://app.collectiveai.tools/api";
const BATCH_SIZE = 50;

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

loadEnv();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");

const API_BASE = (process.env.COLLECTIVE_AI_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");
const prisma = new PrismaClient();

type FilterOption = { name?: string; slug?: string; icon?: string };
type McpItem = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  longDescription?: string;
  author?: string;
  githubUrl?: string;
  url?: string;
  type?: string;
  categories?: FilterOption[];
  language?: FilterOption;
  tags?: string[];
  rating?: number;
  downloads?: number;
  stars?: number;
  views?: number;
  isOfficial?: boolean;
  addedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
  location?: string;
  features?: string[];
  requirements?: string[];
  documentation?: string;
  license?: string;
};

type SkillItem = {
  id?: string;
  name?: string;
  description?: string;
  author?: string;
  repo?: string;
  stars?: number;
  sourceLang?: string;
  installCommand?: string;
  compatibleAgents?: string[];
  category?: string;
  isOfficial?: boolean;
  tags?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type RepositoryItem = {
  title?: string;
  link?: string;
  description?: string;
  language?: string;
  stars?: string | number;
  isoDate?: string;
  pubDate?: string;
};

type McpResponse = {
  data?: McpItem[];
  pagination?: { total?: number; page?: number; totalPages?: number };
};

type SkillResponse = { data?: SkillItem[]; total?: number };
type RepositoryResponse = { data?: RepositoryItem[] };

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(cleanString).filter((item): item is string => item !== null))];
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchJson<T>(url: string, attempts = 4): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "aiBazar resource importer" },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      }
    }
  }

  throw new Error(`Failed to fetch ${url}: ${String(lastError)}`);
}

async function fetchAllMcp(): Promise<McpItem[]> {
  const result: McpItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetchJson<McpResponse>(`${API_BASE}/mcp?limit=500&page=${page}`);
    result.push(...(response.data || []));
    totalPages = Math.max(1, response.pagination?.totalPages || 1);
    page += 1;
  } while (page <= totalPages);

  return result;
}

async function runBatches<T>(items: T[], operation: (item: T) => Promise<unknown>) {
  for (let offset = 0; offset < items.length; offset += BATCH_SIZE) {
    await Promise.all(items.slice(offset, offset + BATCH_SIZE).map(operation));
  }
}

function required(value: unknown, label: string): string {
  const result = cleanString(value);
  if (!result) throw new Error(`Missing ${label} in upstream resource`);
  return result;
}

async function syncMcp(items: McpItem[], syncedAt: Date) {
  const valid = items.filter((item) => cleanString(item._id) && cleanString(item.id) && cleanString(item.name));
  const existing = await prisma.mcpResource.findMany({
    where: { externalId: { in: valid.map((item) => required(item._id, "MCP ID")) } },
    select: {
      externalId: true,
      description: true,
      descriptionRu: true,
      longDescription: true,
      longDescriptionRu: true,
    },
  });
  const existingById = new Map(existing.map((item) => [item.externalId, item]));

  await runBatches(valid, async (item) => {
    const externalId = required(item._id, "MCP external ID");
    const slug = required(item.id, "MCP slug");
    const description = cleanString(item.description) || "";
    const upstreamLongDescription = cleanString(item.longDescription);
    const previous = existingById.get(externalId);
    const longDescription = upstreamLongDescription || previous?.longDescription || null;
    const data = {
      slug,
      name: required(item.name, "MCP name"),
      description,
      descriptionRu: previous?.description === description ? previous.descriptionRu : null,
      longDescription,
      longDescriptionRu:
        previous?.longDescription === longDescription ? previous.longDescriptionRu : null,
      author: cleanString(item.author),
      githubUrl: cleanString(item.githubUrl),
      websiteUrl: cleanString(item.url),
      resourceType: cleanString(item.type) || "MCP Server",
      languageName: cleanString(item.language?.name),
      languageSlug: cleanString(item.language?.slug),
      languageIcon: cleanString(item.language?.icon),
      tags: stringArray(item.tags),
      categoryNames: stringArray(item.categories?.map((category) => category.name)),
      categorySlugs: stringArray(item.categories?.map((category) => category.slug)),
      rating: numberValue(item.rating),
      downloads: numberValue(item.downloads),
      stars: numberValue(item.stars),
      views: numberValue(item.views),
      isOfficial: item.isOfficial === true,
      location: cleanString(item.location),
      features: stringArray(item.features),
      requirements: stringArray(item.requirements),
      documentation: cleanString(item.documentation),
      license: cleanString(item.license),
      source: SOURCE,
      sourceUrl: SOURCE_URL,
      sourceCreatedAt: dateValue(item.createdAt || item.addedDate),
      sourceUpdatedAt: dateValue(item.lastUpdated || item.updatedAt),
      syncedAt,
      isActive: true,
    };

    await prisma.mcpResource.upsert({
      where: { externalId },
      create: { externalId, ...data },
      update: data,
    });
  });

  await prisma.mcpResource.updateMany({
    where: { source: SOURCE, externalId: { notIn: valid.map((item) => required(item._id, "MCP ID")) } },
    data: { isActive: false, syncedAt },
  });

  return valid.length;
}

async function syncSkills(items: SkillItem[], syncedAt: Date) {
  const valid = items.filter((item) => cleanString(item.id) && cleanString(item.name));
  const existing = await prisma.skillResource.findMany({
    where: { externalId: { in: valid.map((item) => required(item.id, "skill ID")) } },
    select: { externalId: true, description: true, descriptionRu: true },
  });
  const existingById = new Map(existing.map((item) => [item.externalId, item]));

  await runBatches(valid, async (item) => {
    const externalId = required(item.id, "skill external ID");
    const description = cleanString(item.description) || "";
    const previous = existingById.get(externalId);
    const data = {
      name: required(item.name, "skill name"),
      description,
      descriptionRu: previous?.description === description ? previous.descriptionRu : null,
      author: cleanString(item.author),
      repoUrl: cleanString(item.repo),
      stars: numberValue(item.stars),
      sourceLanguage: cleanString(item.sourceLang),
      installCommand: cleanString(item.installCommand),
      compatibleAgents: stringArray(item.compatibleAgents),
      category: cleanString(item.category),
      isOfficial: item.isOfficial === true,
      tags: stringArray(item.tags),
      status: cleanString(item.status),
      source: SOURCE,
      sourceUrl: SOURCE_URL,
      sourceCreatedAt: dateValue(item.createdAt),
      sourceUpdatedAt: dateValue(item.updatedAt),
      syncedAt,
      isActive: true,
    };

    await prisma.skillResource.upsert({
      where: { externalId },
      create: { externalId, ...data },
      update: data,
    });
  });

  await prisma.skillResource.updateMany({
    where: { source: SOURCE, externalId: { notIn: valid.map((item) => required(item.id, "skill ID")) } },
    data: { isActive: false, syncedAt },
  });

  return valid.length;
}

async function syncRepositories(items: RepositoryItem[], syncedAt: Date) {
  const valid = items.filter((item) => cleanString(item.link) && cleanString(item.title));
  const existing = await prisma.repositoryResource.findMany({
    where: { url: { in: valid.map((item) => required(item.link, "repository URL")) } },
    select: { url: true, description: true, descriptionRu: true },
  });
  const existingByUrl = new Map(existing.map((item) => [item.url, item]));

  await runBatches(valid, async (item) => {
    const url = required(item.link, "repository URL");
    const name = required(item.title, "repository name");
    const [owner, repositoryName] = name.split("/", 2);
    const description = cleanString(item.description) || "";
    const previous = existingByUrl.get(url);
    const data = {
      name,
      owner: cleanString(owner),
      repositoryName: cleanString(repositoryName),
      description,
      descriptionRu: previous?.description === description ? previous.descriptionRu : null,
      language: cleanString(item.language),
      stars: numberValue(item.stars),
      source: SOURCE,
      sourceUrl: SOURCE_URL,
      sourcePublishedAt: dateValue(item.isoDate || item.pubDate),
      syncedAt,
      lastSeenAt: syncedAt,
      isActive: true,
    };

    await prisma.repositoryResource.upsert({
      where: { url },
      create: { url, ...data },
      update: data,
    });
  });

  await prisma.repositoryResource.updateMany({
    where: { source: SOURCE, url: { notIn: valid.map((item) => required(item.link, "repository URL")) } },
    data: { isActive: false, syncedAt },
  });

  return valid.length;
}

async function main() {
  const databaseTarget = new URL(process.env.DATABASE_URL as string);
  console.log(
    `Resource database target: ${databaseTarget.hostname}:${databaseTarget.port || "5432"}${databaseTarget.pathname}`,
  );
  console.log(`Fetching resources from ${API_BASE}...`);

  const [mcpItems, skillResponse, repositoryResponse] = await Promise.all([
    fetchAllMcp(),
    fetchJson<SkillResponse>(`${API_BASE}/skills`),
    fetchJson<RepositoryResponse>(`${API_BASE}/trending-repos`),
  ]);
  const syncedAt = new Date();

  const [mcp, skills, repositories] = await Promise.all([
    syncMcp(mcpItems, syncedAt),
    syncSkills(skillResponse.data || [], syncedAt),
    syncRepositories(repositoryResponse.data || [], syncedAt),
  ]);

  console.log(
    `Resources synchronized: ${mcp} MCP, ${skills} skills, ${repositories} repositories. Curated prompts are synchronized separately.`,
  );
}

main()
  .catch((error) => {
    console.error("Collective resources synchronization failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
