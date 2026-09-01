"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  variant?: "icon" | "mobile" | "menu";
  className?: string;
};

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Включить светлую тему" : "Включить тёмную тему";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        variant === "mobile"
          ? "flex w-full flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs text-white transition hover:bg-white/10"
          : variant === "menu"
            ? "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-gray-900 transition hover:bg-gray-50 disabled:opacity-60 dark:text-zinc-100 dark:hover:bg-zinc-800"
            : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-60",
        className,
      )}
    >
      {variant === "menu" ? (
        <>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-black dark:border-white/10 dark:bg-zinc-800 dark:text-white">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Тема оформления</span>
            <span className="block text-xs text-gray-500 dark:text-zinc-400">
              {isDark ? "Сейчас включена тёмная" : "Сейчас включена светлая"}
            </span>
          </span>
        </>
      ) : isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      {variant === "mobile" ? <span>Тема</span> : null}
    </button>
  );
}
