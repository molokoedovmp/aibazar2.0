"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenText, Calculator, DollarSign, MessageCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { calcRubPrice } from "@/lib/pricing";

interface PricingCalculatorProps {
  initialStartPrice?: number | null;
  fx: number;
}

const quickValues = [10, 20, 50, 100];

export default function PricingCalculator({
  initialStartPrice,
  fx,
}: PricingCalculatorProps) {
  const [usd, setUsd] = useState<string>(
    initialStartPrice && initialStartPrice > 0 ? String(initialStartPrice) : "",
  );

  const numericUsd = Number(usd);
  const rub = useMemo(() => {
    if (!Number.isFinite(numericUsd) || numericUsd <= 0) return null;
    return calcRubPrice(numericUsd, { fx });
  }, [numericUsd, fx]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.12)]">
      <div className="bg-black p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">
              Расчёт стоимости
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              Подписка на AI-инструмент
            </h2>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
            <Calculator className="h-6 w-6" />
          </span>
        </div>

        <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.07] p-5">
          <p className="text-sm text-white/55">Итоговая стоимость</p>
          <div className="mt-2 flex min-h-12 items-end gap-2">
            <span className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {rub ? rub.toLocaleString("ru-RU") : "—"}
            </span>
            {rub && <span className="pb-1 text-lg text-white/65">₽</span>}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
            <span>Текущий курс USD</span>
            <span className="font-medium text-white">{fx.toFixed(2)} ₽</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <label htmlFor="calculator-usd" className="text-sm font-medium text-black">
          Стоимость подписки в долларах
        </label>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-black/10 px-4 focus-within:border-black/40">
          <DollarSign className="h-5 w-5 shrink-0 text-black/40" />
          <Input
            id="calculator-usd"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={usd}
            onChange={(event) => setUsd(event.target.value)}
            placeholder="Например, 20"
            className="h-14 border-0 bg-transparent px-0 text-lg shadow-none focus-visible:ring-0"
          />
          <span className="text-sm font-medium text-black/45">USD</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {quickValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setUsd(String(value))}
              className="rounded-xl border border-black/10 px-3 py-2.5 text-sm font-medium transition hover:border-black hover:bg-black hover:text-white"
            >
              ${value}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm leading-6 text-black/50">
          Расчёт выполняется по той же формуле, которая используется на страницах
          инструментов. Итог обновляется автоматически при вводе суммы.
        </p>

        <a
          href="https://t.me/aibazaru"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <MessageCircle className="h-5 w-5" />
          Уточнить цены
        </a>

        <Link
          href="/payment-instructions"
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-5 text-sm font-semibold text-black transition hover:border-black hover:bg-black hover:text-white"
        >
          <BookOpenText className="h-4 w-4" />
          Открыть инструкцию по оплате
        </Link>
      </div>
    </div>
  );
}
