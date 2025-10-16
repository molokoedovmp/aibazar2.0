"use client";

import { useCallback, useMemo, useState } from "react";

import FavoriteButton from "@/components/FavoriteButton";
import PriceEditor from "@/components/PriceEditor";
import { PaymentDialog } from "@/components/payment-dialog";

interface ToolPurchaseActionsProps {
  toolId: string;
  toolName: string;
  toolDescription?: string | null;
  toolUrl?: string | null;
  initialRubPrice: number | null;
  initialStartPriceUsd?: number | null;
  fx: number;
  isFavoritedInitial: boolean;
}

export default function ToolPurchaseActions({
  toolId,
  toolName,
  toolDescription,
  toolUrl,
  initialRubPrice,
  initialStartPriceUsd,
  fx,
  isFavoritedInitial,
}: ToolPurchaseActionsProps) {
  const [rubPrice, setRubPrice] = useState<number | null>(initialRubPrice);

  const paymentPrice = useMemo(() => {
    if (typeof rubPrice === "number") return rubPrice;
    if (typeof initialRubPrice === "number") return initialRubPrice;
    return null;
  }, [rubPrice, initialRubPrice]);

  const handlePriceChange = useCallback(
    ({ rub }: { usd: number | null; rub: number | null }) => {
      setRubPrice(typeof rub === "number" ? rub : null);
    },
    []
  );

  return (
    <div className="space-y-3 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {toolUrl && (
          <PaymentDialog
            priceRub={typeof paymentPrice === "number" ? paymentPrice : null}
            tool={{ id: toolId, name: toolName, description: toolDescription, url: toolUrl }}
          >
            <button
              type="button"
              className="inline-flex min-w-[170px] h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-black text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-black"
            >
              Купить доступ
            </button>
          </PaymentDialog>
        )}
        <FavoriteButton
          toolId={toolId}
          isFavoritedInitial={isFavoritedInitial}
          className="flex-1 min-w-[140px] h-10 rounded-lg border border-black/10 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/15"
        />
      </div>
      {toolUrl && (
        <a
          href={toolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/10 text-sm font-medium text-black/80 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-black/5 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
        >
          Официальный сайт
        </a>
      )}
      <PriceEditor
        toolId={toolId}
        initialStartPrice={initialStartPriceUsd}
        fx={fx}
        onPriceChange={handlePriceChange}
        allowZeroClear
      />
    </div>
  );
}
