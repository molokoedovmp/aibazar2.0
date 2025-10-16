"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

interface CreateDocumentButtonProps {
  className?: string;
  children?: ReactNode;
}

export default function CreateDocumentButton({ className, children }: CreateDocumentButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (isPending) return;
    setIsPending(true);
    try {
      const r = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Новый документ" }),
      });
      if (!r.ok) return;
      const d = await r.json();
      if (d?.id) window.location.href = `/account/documents?doc=${d.id}`;
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_25px_-12px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-14px_rgba(0,0,0,0.65)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black",
        className
      )}
    >
      {children ?? "Создать документ"}
    </button>
  );
}
