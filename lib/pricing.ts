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

// Кешируем курс в памяти на 10 минут, чтобы не ходить к внешнему API на каждый запрос
export async function getUsdFx(): Promise<number> {
  const now = Date.now();
  const ttlMs = 10 * 60 * 1000; // 10 минут
  if (global.__fxCache && now - global.__fxCache.ts < ttlMs) {
    return global.__fxCache.value;
  }

  const url = process.env.CBR_FX_URL || "https://www.cbr-xml-daily.ru/daily_json.js";

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    const json = await res.json().catch(() => null);
    const value = json?.Valute?.USD?.Value;
    if (typeof value === "number" && Number.isFinite(value)) {
      global.__fxCache = { value, ts: now };
      return value;
    }
  } catch {}

  // дефолт на случай недоступности API или парсинга
  const fallback = 84;
  global.__fxCache = { value: fallback, ts: now };
  return fallback;
}
