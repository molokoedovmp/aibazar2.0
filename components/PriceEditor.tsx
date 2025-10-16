"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { calcRubPrice } from "@/lib/pricing";

interface PriceEditorProps {
  toolId: string;
  fx: number;
  initialStartPrice?: number | null;
  onPriceChange?: (payload: { usd: number | null; rub: number | null }) => void;
  allowZeroClear?: boolean;
}

export default function PriceEditor({ toolId: _toolId, fx, initialStartPrice, onPriceChange, allowZeroClear }: PriceEditorProps) {
  const [usd, setUsd] = useState<number | null>(initialStartPrice ?? null);

  const rub = useMemo(() => (usd && usd > 0 ? calcRubPrice(usd, { fx }) : null), [usd, fx]);

  const updateLive = (v: number | null) => {
    const next = v && v > 0 ? calcRubPrice(v, { fx }) : null;
    const el = document.getElementById("current-price-value");
    if (el) {
      if (typeof next === "number") {
        el.textContent = `${next.toLocaleString("ru-RU")} ₽`;
      } else {
        // Когда поле очищено или значение некорректно — показываем прочерк
        el.textContent = "—";
      }
    }
    const usdEl = document.getElementById("current-price-usd");
    if (usdEl) usdEl.textContent = v && v > 0 ? `≈ $${v}` : "—";
  };

  useEffect(() => {
    const normalizedUsd = usd && usd > 0 ? usd : null;
    onPriceChange?.({ usd: normalizedUsd, rub });
  }, [usd, rub, onPriceChange]);

  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 px-3 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-black dark:text-white">Пересчитать стоимость</span>
        <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Курс {fx.toFixed(2)} ₽</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          type="number"
          min={allowZeroClear ? 0 : 1}
          step={1}
          value={usd ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setUsd(null);
              updateLive(null);
              return;
            }
            const v = Number(raw);
            setUsd(v);
            updateLive(v);
          }}
          className="h-10 flex-1 rounded-lg border border-black/10 bg-white text-base font-medium text-black focus-visible:ring-1 focus-visible:ring-black dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:focus-visible:ring-white"
          placeholder="Сумма в USD"
        />
        <span className="text-sm font-medium text-black/70 dark:text-white/70">USD</span>
      </div>
      <div className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-xs text-black/80 dark:bg-white/10 dark:text-white/70">
        {rub ? `Итого по текущему курсу: ${rub.toLocaleString("ru-RU")} ₽` : "Введите стоимость, чтобы увидеть пересчет"}
      </div>
    </div>
  );
}
