#!/usr/bin/env tsx

import { promises as dns } from "node:dns";
import { promises as fs } from "node:fs";
import { isIP } from "node:net";
import path from "node:path";
import sharp from "sharp";

const EXPORT_DIR = path.resolve(process.cwd(), "data", "db-export");
const AI_TOOLS_PATH = path.join(EXPORT_DIR, "AiTool.json");
const REPORT_PATH = path.join(EXPORT_DIR, "catalog-images-report.json");
const OUTPUT_DIR = path.resolve(process.cwd(), "public", "tool-images");
const USER_AGENT =
  "Mozilla/5.0 (compatible; AIBazarCatalogBot/1.0; +https://ai-bazar.ru)";
const MAX_HTML_BYTES = 1_500_000;
const MAX_IMAGE_BYTES = 5_000_000;
const PAGE_TIMEOUT_MS = 8_000;
const IMAGE_TIMEOUT_MS = 10_000;

type Tool = {
  id: string;
  name: string;
  url?: string | null;
  coverImage?: string | null;
  [key: string]: unknown;
};

type ImageCandidate = {
  url: string;
  kind: "cover" | "icon";
};

type Success = {
  ok: true;
  tool: Tool;
  source: ImageCandidate;
};

type Failure = {
  ok: false;
  tool: Tool;
  reason: string;
};

type Result = Success | Failure;

const dnsCache = new Map<string, Promise<string[]>>();

function readNumberArg(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function isPrivateIp(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const ipv4 = isIP(normalized) === 4 ? normalized : mappedIpv4;
  if (!ipv4) return false;

  const [a, b] = ipv4.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

async function resolveHost(hostname: string): Promise<string[]> {
  const key = hostname.toLowerCase();
  let cached = dnsCache.get(key);
  if (!cached) {
    cached = dns.lookup(hostname, { all: true, verbatim: true }).then((records) =>
      records.map((record) => record.address),
    );
    dnsCache.set(key, cached);
  }
  return cached;
}

async function assertPublicUrl(input: string): Promise<URL> {
  const url = new URL(input);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`unsupported protocol: ${url.protocol}`);
  }
  if (url.username || url.password) throw new Error("URLs with credentials are not allowed");
  if (url.hostname.toLowerCase() === "localhost") throw new Error("local URL is not allowed");

  const addresses = isIP(url.hostname) ? [url.hostname] : await resolveHost(url.hostname);
  if (!addresses.length || addresses.some(isPrivateIp)) {
    throw new Error("private or unresolved address");
  }
  return url;
}

async function fetchWithSafeRedirects(
  input: string,
  timeoutMs: number,
  accept: string,
): Promise<{ response: Response; finalUrl: string }> {
  let current = input;

  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const url = await assertPublicUrl(current);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: accept,
        "Accept-Language": "en-US,en;q=0.8",
        "User-Agent": USER_AGENT,
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`redirect ${response.status} without location`);
      current = new URL(location, url).toString();
      continue;
    }

    return { response, finalUrl: url.toString() };
  }

  throw new Error("too many redirects");
}

async function readBodyWithLimit(response: Response, limit: number): Promise<Buffer> {
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > limit) throw new Error(`response is larger than ${limit} bytes`);
  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error(`response exceeded ${limit} bytes`);
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    );
}

function attribute(tag: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? decodeHtml(match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function absoluteImageUrl(value: string | null, baseUrl: string): string | null {
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractCandidates(html: string, pageUrl: string): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attribute(tag, "property") || attribute(tag, "name") || "").toLowerCase();
    if (!["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"].includes(key)) {
      continue;
    }
    const url = absoluteImageUrl(attribute(tag, "content"), pageUrl);
    if (url) candidates.push({ url, kind: "cover" });
  }

  const icons: Array<ImageCandidate & { priority: number }> = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attribute(tag, "rel") || "").toLowerCase();
    if (!rel.includes("icon")) continue;
    const url = absoluteImageUrl(attribute(tag, "href"), pageUrl);
    if (!url) continue;
    const priority = rel.includes("apple-touch-icon") ? 0 : rel === "icon" ? 1 : 2;
    icons.push({ url, kind: "icon", priority });
  }
  icons.sort((a, b) => a.priority - b.priority);
  candidates.push(...icons.map(({ url, kind }) => ({ url, kind })));

  try {
    candidates.push({ url: new URL("/favicon.ico", pageUrl).toString(), kind: "icon" });
  } catch {
    // The page URL was already validated, so this is only a defensive fallback.
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

function fallbackIconCandidates(input: string | null | undefined): ImageCandidate[] {
  if (!input) return [];

  try {
    const baseUrl = new URL(input);
    return [
      "/apple-touch-icon.png",
      "/apple-touch-icon-precomposed.png",
      "/favicon.svg",
      "/favicon.png",
      "/favicon.ico",
    ].map((pathname) => ({
      url: new URL(pathname, baseUrl).toString(),
      kind: "icon" as const,
    }));
  } catch {
    return [];
  }
}

async function pageImageCandidates(tool: Tool): Promise<ImageCandidate[]> {
  if (!tool.url) throw new Error("missing website URL");
  const { response, finalUrl } = await fetchWithSafeRedirects(
    tool.url,
    PAGE_TIMEOUT_MS,
    "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
  );
  if (!response.ok) throw new Error(`website returned HTTP ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    throw new Error(`website returned ${contentType || "an unknown content type"}`);
  }
  const html = (await readBodyWithLimit(response, MAX_HTML_BYTES)).toString("utf8");
  return extractCandidates(html, finalUrl);
}

async function downloadCandidate(candidate: ImageCandidate): Promise<Buffer> {
  const { response } = await fetchWithSafeRedirects(
    candidate.url,
    IMAGE_TIMEOUT_MS,
    "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.5",
  );
  if (!response.ok) throw new Error(`image returned HTTP ${response.status}`);
  return readBodyWithLimit(response, MAX_IMAGE_BYTES);
}

async function makeCover(input: Buffer, kind: ImageCandidate["kind"]): Promise<Buffer> {
  const source = sharp(input, { limitInputPixels: 40_000_000, animated: false });
  await source.metadata();

  if (kind === "cover") {
    return source
      .rotate()
      .resize(640, 360, { fit: "cover", position: "attention", withoutEnlargement: false })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
  }

  const logo = await source
    .rotate()
    .resize(180, 180, { fit: "inside", withoutEnlargement: false })
    .webp({ quality: 88 })
    .toBuffer();

  return sharp({
    create: {
      width: 640,
      height: 360,
      channels: 4,
      background: { r: 250, g: 250, b: 250, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

async function enrichTool(tool: Tool): Promise<Result> {
  const errors: string[] = [];
  let candidates: ImageCandidate[] = [];

  try {
    candidates = await pageImageCandidates(tool);
  } catch (error) {
    errors.push(`page: ${error instanceof Error ? error.message : String(error)}`);
  }

  candidates.push(...fallbackIconCandidates(tool.url));
  candidates = candidates.filter(
    (candidate, index, all) => all.findIndex(({ url }) => url === candidate.url) === index,
  );

  if (!candidates.length) {
    return { ok: false, tool, reason: errors.at(-1) || "no image candidates found" };
  }

  try {
    const attempts = await Promise.all(
      candidates.slice(0, 8).map(async (candidate) => {
      try {
        const downloaded = await downloadCandidate(candidate);
        const cover = await makeCover(downloaded, candidate.kind);
          return { candidate, cover };
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
          return null;
      }
      }),
    );

    const successful = attempts.find((attempt) => attempt !== null);
    if (successful) {
      const fileName = `${tool.id}.webp`;
      await fs.writeFile(path.join(OUTPUT_DIR, fileName), successful.cover);
      tool.coverImage = `/tool-images/${fileName}`;
      return { ok: true, tool, source: successful.candidate };
    }

    return {
      ok: false,
      tool,
      reason: errors.at(-1) || "all image candidates failed",
    };
  } catch (error) {
    return {
      ok: false,
      tool,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function writeCatalog(tools: Tool[]) {
  await fs.writeFile(AI_TOOLS_PATH, `${JSON.stringify(tools, null, 2)}\n`, "utf8");
}

async function main() {
  const concurrency = Math.min(readNumberArg("--concurrency", 6), 12);
  const limit = readNumberArg("--limit", Number.MAX_SAFE_INTEGER);
  const tools = JSON.parse(await fs.readFile(AI_TOOLS_PATH, "utf8")) as Tool[];
  const pending = tools.filter((tool) => !tool.coverImage && tool.url).slice(0, limit);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const backupSuffix = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.copyFile(AI_TOOLS_PATH, `${AI_TOOLS_PATH}.${backupSuffix}.images.bak`);

  const successes: Success[] = [];
  const failures: Failure[] = [];
  console.log(`Catalog images: ${pending.length} pending, concurrency ${concurrency}`);

  for (let offset = 0; offset < pending.length; offset += concurrency) {
    const batch = pending.slice(offset, offset + concurrency);
    const results = await Promise.all(batch.map(enrichTool));
    for (const result of results) {
      if (result.ok) successes.push(result);
      else failures.push(result);
    }

    await writeCatalog(tools);
    const processed = Math.min(offset + batch.length, pending.length);
    console.log(
      `[${processed}/${pending.length}] saved ${successes.length}, failed ${failures.length}`,
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    processed: pending.length,
    saved: successes.length,
    failed: failures.length,
    covers: successes.filter((result) => result.source.kind === "cover").length,
    icons: successes.filter((result) => result.source.kind === "icon").length,
    failures: failures.map((result) => ({
      id: result.tool.id,
      name: result.tool.name,
      url: result.tool.url,
      reason: result.reason,
    })),
  };
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...report, failures: undefined }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
