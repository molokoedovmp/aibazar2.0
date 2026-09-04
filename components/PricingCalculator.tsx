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
    <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
      <div className="bg-black p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">
              Расчёт стоимости
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-[28px]">
              Подписка на AI-инструмент
            </h2>
          </div>
          <span className="theme-light-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black">
            <Calculator className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.07] p-4">
          <p className="text-sm text-white/55">Итоговая стоимость</p>
          <div className="mt-2 flex min-h-10 items-end gap-2">
            <span className="text-4xl font-semibold tracking-[-0.04em]">
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

      <div className="p-5 sm:p-6">
        <label htmlFor="calculator-usd" className="text-sm font-medium text-black dark:text-zinc-100">
          Стоимость подписки в долларах
        </label>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-black/10 px-4 focus-within:border-black/40 dark:border-white/10 dark:bg-black dark:focus-within:border-white/35">
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
            className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />
          <span className="text-sm font-medium text-black/45">USD</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {quickValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setUsd(String(value))}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium transition hover:border-black hover:bg-black hover:text-white dark:border-white/10 dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
            >
              ${value}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm leading-6 text-black/50 dark:text-white/50">
          Это предварительный расчёт. Чтобы уточнить итоговую сумму и оплатить
          подписку, отправьте мне в Telegram название сервиса и выбранный тариф.
        </p>

        <a
          href="https://t.me/aibazaru"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <MessageCircle className="h-5 w-5" />
          Написать по оплате
        </a>

        <Link
          href="/payment-instructions"
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-5 text-sm font-semibold text-black transition hover:border-black hover:bg-black hover:text-white dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:bg-white dark:hover:text-black"
        >
          <BookOpenText className="h-4 w-4" />
          Как проходит оплата
        </Link>
      </div>
    </div>
  );
}
