"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyTextButton({ value, label = "Копировать" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/85 dark:bg-white dark:text-black"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Скопировано" : label}
    </button>
  );
}
