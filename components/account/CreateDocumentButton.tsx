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
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-black px-3 text-xs font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black",
        className
      )}
    >
      {children ?? "Создать документ"}
    </button>
  );
}
