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

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36 Edg/151";
const MAX_CHUNK_LENGTH = 900;
const TRANSLATION_CONCURRENCY = 3;

let translatorConfig: TranslatorConfig | null = null;
let configPromise: Promise<TranslatorConfig> | null = null;
let requestCounter = 0;

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchTranslatorConfig(): Promise<TranslatorConfig> {
  const response = await fetch("https://www.bing.com/translator", {
    signal: AbortSignal.timeout(15_000),
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
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
    cache: "no-store",
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`translation returned HTTP ${response.status}`);
  const payload = JSON.parse(raw) as Array<{ translations?: Array<{ text?: string }> }>;
  const translated = payload[0]?.translations?.[0]?.text?.trim();
  if (!translated) throw new Error("translation is empty");
  return translated;
}

export async function translateTextToRussian(text: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await requestTranslation(text, attempt > 1);
    } catch (error) {
      lastError = error;
      await delay(attempt * 750);
    }
  }
  throw lastError;
}

function splitLongPart(value: string) {
  const chunks: string[] = [];
  let rest = value;

  while (rest.length > MAX_CHUNK_LENGTH) {
    const candidate = rest.slice(0, MAX_CHUNK_LENGTH);
    const boundary = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(". "), candidate.lastIndexOf(" "));
    const end = boundary > MAX_CHUNK_LENGTH * 0.55 ? boundary + 1 : MAX_CHUNK_LENGTH;
    chunks.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function markdownParts(markdown: string) {
  const fencedCode = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  const sections = markdown.split(fencedCode);
  const parts: Array<{ text: string; translate: boolean }> = [];

  for (const section of sections) {
    if (!section) continue;
    if (/^(?:```|~~~)/.test(section)) {
      parts.push({ text: section, translate: false });
      continue;
    }

    const paragraphs = section.split(/(\n\s*\n)/);
    for (const paragraph of paragraphs) {
      if (!paragraph) continue;
      const shouldPreserve =
        /^\n\s*\n$/.test(paragraph) ||
        /^\s*#\s+\S+\s*$/.test(paragraph) ||
        /^\s*(?:!\[|\[!\[|<\/?(?:img|picture|video|source|details|summary))/i.test(paragraph);
      if (shouldPreserve || !paragraph.trim()) {
        parts.push({ text: paragraph, translate: false });
      } else {
        parts.push(...splitLongPart(paragraph).map((text) => ({ text, translate: true })));
      }
    }
  }

  return parts;
}

export async function translateMarkdownToRussian(markdown: string) {
  const parts = markdownParts(markdown);
  const result = [...parts];
  const pending = parts
    .map((part, index) => ({ ...part, index }))
    .filter((part) => part.translate && part.text.trim());

  for (let offset = 0; offset < pending.length; offset += TRANSLATION_CONCURRENCY) {
    const batch = pending.slice(offset, offset + TRANSLATION_CONCURRENCY);
    const translations = await Promise.all(
      batch.map(async (part) => {
        const leadingWhitespace = part.text.match(/^\s*/)?.[0] || "";
        const trailingWhitespace = part.text.match(/\s*$/)?.[0] || "";
        const content = part.text.slice(
          leadingWhitespace.length,
          part.text.length - trailingWhitespace.length,
        );
        return {
          index: part.index,
          text: `${leadingWhitespace}${await translateTextToRussian(content)}${trailingWhitespace}`,
        };
      }),
    );
    for (const translation of translations) {
      result[translation.index] = { text: translation.text, translate: false };
    }
  }

  return result.map((part) => part.text).join("");
}
