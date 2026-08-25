#!/usr/bin/env tsx

import { promises as fs } from "node:fs";
import path from "node:path";

const CATALOG_PATH = path.resolve(process.cwd(), "data", "db-export", "AiTool.json");
const REPORT_PATH = path.resolve(
  process.cwd(),
  "data",
  "db-export",
  "catalog-translation-report.json",
);
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36 Edg/151";

type Tool = {
  id: string;
  name: string;
  description: string;
  [key: string]: unknown;
};

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

let translatorConfig: TranslatorConfig | null = null;
let configPromise: Promise<TranslatorConfig> | null = null;
let requestCounter = 0;

function readNumberArg(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function hasCyrillic(value: string): boolean {
  return /[\u0400-\u04FF]/.test(value);
}

function removeSourceReference(value: string): string {
  return value.replace(/\s+(?:[5-9]\d|1[0-4]\d)\.?$/, "").trim();
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchTranslatorConfig(): Promise<TranslatorConfig> {
  const response = await fetch("https://www.bing.com/translator", {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`translator page returned HTTP ${response.status}`);

  const body = await response.text();
  const IG = body.match(/IG:"([^"]+)"/)?.[1];
  const IID = body.match(/data-iid="([^"]+)"/)?.[1];
  const paramsMatch = body.match(/params_AbusePreventionHelper\s?=\s?([^\]]+\])/);
  if (!IG || !IID || !paramsMatch) throw new Error("translator configuration was not found");

  const [key, token, expiresIn] = JSON.parse(paramsMatch[1]) as [number, string, number];
  const config = {
    host: new URL(response.url).host,
    referer: response.url,
    IG,
    IID,
    key,
    token,
    fetchedAt: Date.now(),
    expiresIn,
  };
  translatorConfig = config;
  requestCounter = 0;
  return config;
}

async function getTranslatorConfig(forceRefresh = false): Promise<TranslatorConfig> {
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

async function requestTranslation(text: string, forceRefresh = false): Promise<string> {
  const config = await getTranslatorConfig(forceRefresh);
  const SFX = ++requestCounter;
  const url = new URL(`https://${config.host}/ttranslatev3`);
  url.searchParams.set("isVertical", "1");
  url.searchParams.set("IG", config.IG);
  url.searchParams.set("IID", config.IID);
  url.searchParams.set("SFX", String(SFX));
  url.searchParams.set("ref", "TThis");
  url.searchParams.set("edgepdftranslator", "1");

  const form = new URLSearchParams({
    fromLang: "en",
    to: "ru",
    text,
    token: config.token,
    key: String(config.key),
    tryFetchingGenderDebiasedTranslations: "true",
  });
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: config.referer,
      "User-Agent": USER_AGENT,
    },
    body: form,
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`translation returned HTTP ${response.status}: ${raw}`);
  const data = JSON.parse(raw) as Array<{
    translations?: Array<{ text?: string }>;
  }>;
  const translated = data[0]?.translations?.[0]?.text?.trim();
  if (!translated || !hasCyrillic(translated)) {
    throw new Error("translation is empty or does not contain Russian text");
  }
  return translated;
}

async function translateWithRetry(text: string): Promise<string> {
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

async function writeCatalog(tools: Tool[]) {
  await fs.writeFile(CATALOG_PATH, `${JSON.stringify(tools, null, 2)}\n`, "utf8");
}

async function main() {
  const concurrency = Math.min(readNumberArg("--concurrency", 3), 6);
  const limit = readNumberArg("--limit", Number.MAX_SAFE_INTEGER);
  const tools = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8")) as Tool[];
  let cleanedReferences = 0;
  for (const tool of tools) {
    const cleaned = removeSourceReference(tool.description);
    if (cleaned !== tool.description) {
      tool.description = cleaned;
      cleanedReferences += 1;
    }
  }
  const pending = tools
    .filter((tool) => tool.description?.trim() && !hasCyrillic(tool.description))
    .slice(0, limit);
  const suffix = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.copyFile(CATALOG_PATH, `${CATALOG_PATH}.${suffix}.translate.bak`);

  const failures: Array<{ id: string; name: string; reason: string }> = [];
  let translated = 0;
  console.log(`Catalog translation: ${pending.length} pending, concurrency ${concurrency}`);

  for (let offset = 0; offset < pending.length; offset += concurrency) {
    const batch = pending.slice(offset, offset + concurrency);
    const results = await Promise.all(
      batch.map(async (tool) => {
        try {
          return { tool, translation: await translateWithRetry(tool.description), error: null };
        } catch (error) {
          return {
            tool,
            translation: null,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    for (const result of results) {
      if (result.translation) {
        result.tool.description = result.translation;
        translated += 1;
      } else {
        failures.push({ id: result.tool.id, name: result.tool.name, reason: result.error ?? "unknown" });
      }
    }

    await writeCatalog(tools);
    const processed = Math.min(offset + batch.length, pending.length);
    console.log(`[${processed}/${pending.length}] translated ${translated}, failed ${failures.length}`);
    await delay(150);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    processed: pending.length,
    translated,
    cleanedReferences,
    failed: failures.length,
    remainingEnglish: tools.filter(
      (tool) => tool.description?.trim() && !hasCyrillic(tool.description),
    ).length,
    failures,
  };
  await writeCatalog(tools);
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...report, failures: undefined }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
