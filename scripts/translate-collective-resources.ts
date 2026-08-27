#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT_DIR = path.resolve(__dirname, "..");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36 Edg/151";

type TranslatorConfig = {
  host: string;
  referer: string;
  IG: string;
  IID: string;
  key: number;
  token: string;
  fetchedAt: number;
  expiresIn: number;
};

type TranslationTask = {
  id: string;
  label: string;
  text: string;
  save: (translation: string) => Promise<unknown>;
};

function loadEnv() {
  for (const fileName of [".env.local", ".env", ".env.production"]) {
    const candidate = path.join(ROOT_DIR, fileName);
    if (!fs.existsSync(candidate)) continue;
    const isLocalEnv = fileName === ".env.local";

    for (const line of fs.readFileSync(candidate, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["'](.+)["']$/, "$1");
      if (key && (isLocalEnv || !process.env[key])) process.env[key] = value;
    }
  }
}

function numberArgument(name: string, fallback: number) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? Number(process.argv[index + 1]) : Number.NaN;
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function hasCyrillic(value: string) {
  return /[\u0400-\u04ff]/.test(value);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

loadEnv();
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");

const prisma = new PrismaClient();
let translatorConfig: TranslatorConfig | null = null;
let configPromise: Promise<TranslatorConfig> | null = null;
let requestCounter = 0;

async function fetchTranslatorConfig(): Promise<TranslatorConfig> {
  const response = await fetch("https://www.bing.com/translator", {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`translator page returned HTTP ${response.status}`);

  const body = await response.text();
  const IG = body.match(/IG:"([^"]+)"/)?.[1];
  const IID = body.match(/data-iid="([^"]+)"/)?.[1];
  const params = body.match(/params_AbusePreventionHelper\s?=\s?([^\]]+\])/);
  if (!IG || !IID || !params) throw new Error("translator configuration was not found");

  const [key, token, expiresIn] = JSON.parse(params[1]) as [number, string, number];
  translatorConfig = {
    host: new URL(response.url).host,
    referer: response.url,
    IG,
    IID,
    key,
    token,
    fetchedAt: Date.now(),
    expiresIn,
  };
  requestCounter = 0;
  return translatorConfig;
}

async function getTranslatorConfig(forceRefresh = false) {
  const expired =
    !translatorConfig || Date.now() - translatorConfig.fetchedAt > translatorConfig.expiresIn - 30_000;
  if (forceRefresh || expired) configPromise = fetchTranslatorConfig();
  configPromise ??= Promise.resolve(translatorConfig as TranslatorConfig);

  try {
    return await configPromise;
  } finally {
    configPromise = null;
  }
}

async function requestTranslation(text: string, forceRefresh = false) {
  if (hasCyrillic(text)) return text;

  const config = await getTranslatorConfig(forceRefresh);
  const url = new URL(`https://${config.host}/ttranslatev3`);
  url.searchParams.set("isVertical", "1");
  url.searchParams.set("IG", config.IG);
  url.searchParams.set("IID", config.IID);
  url.searchParams.set("SFX", String(++requestCounter));
  url.searchParams.set("ref", "TThis");

  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: config.referer,
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      fromLang: "auto-detect",
      to: "ru",
      text,
      token: config.token,
      key: String(config.key),
      tryFetchingGenderDebiasedTranslations: "true",
    }),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`translation returned HTTP ${response.status}: ${raw}`);
  const payload = JSON.parse(raw) as Array<{ translations?: Array<{ text?: string }> }>;
  const translated = payload[0]?.translations?.[0]?.text?.trim();
  if (!translated || !hasCyrillic(translated)) throw new Error("Russian translation was not returned");
  return translated;
}

async function translateWithRetry(text: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await requestTranslation(text, attempt > 1);
    } catch (error) {
      lastError = error;
      await delay(attempt * 1_000);
    }
  }
  throw lastError;
}

async function translationTasks(): Promise<TranslationTask[]> {
  const [mcpResources, prompts, skills, repositories] = await Promise.all([
    prisma.mcpResource.findMany({
      where: { isActive: true, descriptionRu: null },
      select: { id: true, name: true, description: true },
    }),
    prisma.promptResource.findMany({
      where: { isActive: true, OR: [{ titleRu: null }, { descriptionRu: null }] },
      select: { id: true, title: true, titleRu: true, description: true, descriptionRu: true },
    }),
    prisma.skillResource.findMany({
      where: { isActive: true, descriptionRu: null },
      select: { id: true, name: true, description: true },
    }),
    prisma.repositoryResource.findMany({
      where: { isActive: true, descriptionRu: null },
      select: { id: true, name: true, description: true },
    }),
  ]);
  const tasks: TranslationTask[] = [];

  for (const mcp of mcpResources) {
    if (!mcp.description.trim()) continue;
    tasks.push({
      id: mcp.id,
      label: `MCP description: ${mcp.name}`,
      text: mcp.description,
      save: (descriptionRu) =>
        prisma.mcpResource.update({ where: { id: mcp.id }, data: { descriptionRu } }),
    });
  }

  for (const prompt of prompts) {
    if (!prompt.titleRu && prompt.title.trim()) {
      tasks.push({
        id: prompt.id,
        label: `prompt title: ${prompt.title}`,
        text: prompt.title,
        save: (titleRu) => prisma.promptResource.update({ where: { id: prompt.id }, data: { titleRu } }),
      });
    }
    if (!prompt.descriptionRu && prompt.description?.trim()) {
      tasks.push({
        id: prompt.id,
        label: `prompt description: ${prompt.title}`,
        text: prompt.description,
        save: (descriptionRu) =>
          prisma.promptResource.update({ where: { id: prompt.id }, data: { descriptionRu } }),
      });
    }
  }

  for (const skill of skills) {
    if (!skill.description.trim()) continue;
    tasks.push({
      id: skill.id,
      label: `skill description: ${skill.name}`,
      text: skill.description,
      save: (descriptionRu) => prisma.skillResource.update({ where: { id: skill.id }, data: { descriptionRu } }),
    });
  }

  for (const repository of repositories) {
    if (!repository.description.trim()) continue;
    tasks.push({
      id: repository.id,
      label: `repository description: ${repository.name}`,
      text: repository.description,
      save: (descriptionRu) =>
        prisma.repositoryResource.update({ where: { id: repository.id }, data: { descriptionRu } }),
    });
  }

  return tasks;
}

async function main() {
  const concurrency = Math.min(numberArgument("--concurrency", 3), 6);
  const limit = numberArgument("--limit", Number.MAX_SAFE_INTEGER);
  const tasks = (await translationTasks()).slice(0, limit);
  const failures: Array<{ id: string; label: string; reason: string }> = [];
  let translated = 0;

  console.log(`Collective resource translation: ${tasks.length} fields pending.`);
  for (let offset = 0; offset < tasks.length; offset += concurrency) {
    const batch = tasks.slice(offset, offset + concurrency);
    const results = await Promise.all(
      batch.map(async (task) => {
        try {
          const translation = await translateWithRetry(task.text);
          await task.save(translation);
          return { task, error: null };
        } catch (error) {
          return { task, error: error instanceof Error ? error.message : String(error) };
        }
      }),
    );

    for (const result of results) {
      if (result.error) failures.push({ id: result.task.id, label: result.task.label, reason: result.error });
      else translated += 1;
    }

    console.log(`[${Math.min(offset + batch.length, tasks.length)}/${tasks.length}] translated ${translated}, failed ${failures.length}`);
    await delay(150);
  }

  console.log(JSON.stringify({ pending: tasks.length, translated, failed: failures.length }, null, 2));
  if (failures.length) console.warn(JSON.stringify(failures, null, 2));
}

main()
  .catch((error) => {
    console.error("Collective resource translation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
