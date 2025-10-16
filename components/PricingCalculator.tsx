"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { calcRubPrice } from "@/lib/pricing";

export default function PricingCalculator({
  initialStartPrice,
  fx,
}: {
  initialStartPrice?: number | null;
  fx: number;
}) {
  const [usd, setUsd] = useState<number>(initialStartPrice ?? 0);

  const rub = useMemo(() => {
    if (!usd || usd <= 0) return null;
    return calcRubPrice(usd, { fx });
  }, [usd, fx]);

  return (
    <div className="mt-4 rounded-md border border-black/10 dark:border-white/10 p-3">
      <div className="text-sm font-medium mb-2">Рассчитать свою цену</div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          step={1}
          value={usd ?? 0}
          onChange={(e) => setUsd(Number(e.target.value))}
          className="w-36"
          placeholder="USD"
        />
        <span className="text-sm text-black/60 dark:text-white/60">USD</span>
      </div>
      <div className="mt-2 text-sm text-black/70 dark:text-white/70">
        Курс: {fx.toFixed(2)} ₽ • Итого: {rub ? `${rub.toLocaleString('ru-RU')} ₽ / мес` : '—'}
      </div>
    </div>
  );
}

