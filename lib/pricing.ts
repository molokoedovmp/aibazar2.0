export type PriceOptions = {
  fx: number; // текущий курс доллара (RUB per USD)
  deltaRate?: number; // надбавка к курсу, по умолчанию 4
  fixedFee?: number; // фиксированная надбавка, по умолчанию 750
};

export function calcRubPrice(startprice: number, opts: PriceOptions) {
  const fx = opts.fx;
  const deltaRate = opts.deltaRate ?? 4;
  const fixedFee = opts.fixedFee ?? 750;

  const commission = 0.03 + 0.001 * startprice; // 3% + 0.1% за каждый доллар

  const base = startprice * (fx + deltaRate);
  const priceWithCommission = base * (1 + commission);
  const finalPrice = priceWithCommission + fixedFee;

  return Math.ceil(finalPrice / 10) * 10; // округление вверх до 10 рублей
}

// Простой helper получения курса USD с резервом по умолчанию
declare global {
  // eslint-disable-next-line no-var
  var __fxCache: { value: number; ts: number } | undefined;
}

const FX_FETCH_TIMEOUT_MS = 4000;

async function fetchJson(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FX_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      signal: controller.signal,
      headers: { "User-Agent": "aibazar-fx/1.0", Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FX_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      signal: controller.signal,
      headers: { "User-Agent": "aibazar-fx/1.0", Accept: "application/xml,text/xml,*/*" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCbrXmlUsd(xml: string | null): number | null {
  if (!xml) return null;
  const match = xml.match(/<CharCode>USD<\/CharCode>[\s\S]*?<Value>([^<]+)<\/Value>/i);
  if (!match) return null;
  const raw = match[1].replace(",", ".").trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function parseMoexUsd(json: any): number | null {
  const cbrf = json?.cbrf;
  const columns = cbrf?.columns;
  const data = cbrf?.data?.[0];
  if (!Array.isArray(columns) || !Array.isArray(data)) return null;
  const idx = columns.indexOf("CBRF_USD_LAST");
  if (idx < 0) return null;
  const value = data[idx];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function parseCbrJsonUsd(json: any): number | null {
  const value = json?.Valute?.USD?.Value;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

// Кешируем курс в памяти на 10 минут, чтобы не ходить к внешнему API на каждый запрос
export async function getUsdFx(): Promise<number> {
  const now = Date.now();
  const ttlMs = 10 * 60 * 1000; // 10 минут
  if (global.__fxCache && now - global.__fxCache.ts < ttlMs) {
    return global.__fxCache.value;
  }

  const cachedValue = global.__fxCache?.value;
  const envUrl = process.env.CBR_FX_URL;
  const envLooksJson = typeof envUrl === "string" && /\.(json|js)$/i.test(envUrl);
  const sources: Array<{ type: "json" | "xml"; url: string }> = [];
  if (envUrl) {
    sources.push({ type: envLooksJson ? "json" : "xml", url: envUrl });
  }
  sources.push(
    { type: "json", url: "https://www.cbr-xml-daily.ru/daily_json.js" },
    { type: "xml", url: "https://www.cbr.ru/scripts/XML_daily.asp" },
    { type: "json", url: "https://iss.moex.com/iss/statistics/engines/currency/markets/selt/rates.json?iss.meta=off" }
  );

  try {
    for (const source of sources) {
      let value: number | null = null;
      if (source.type === "json") {
        const json = await fetchJson(source.url);
        value = source.url.includes("moex.com") ? parseMoexUsd(json) : parseCbrJsonUsd(json);
      } else {
        const xml = await fetchText(source.url);
        value = parseCbrXmlUsd(xml);
      }

      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        global.__fxCache = { value, ts: now };
        return value;
      }
    }
  } catch {
    // ignore
  }

  if (typeof cachedValue === "number" && Number.isFinite(cachedValue) && cachedValue > 0) {
    global.__fxCache = { value: cachedValue, ts: now };
    return cachedValue;
  }

  // дефолт на случай недоступности API или парсинга
  const fallback = 84;
  global.__fxCache = { value: fallback, ts: now };
  return fallback;
}
