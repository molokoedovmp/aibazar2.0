"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { ToolImage } from "@/app/components/ToolImage";

type Tool = {
  id: string;
  name: string;
  description: string;
  coverImage?: string | null;
  type?: string | null;
  rating?: number | null;
  category?: {
    id: string;
    name: string;
  };
};

const POPULAR_TOOL_NAMES = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Midjourney",
  "Perplexity",
  "Cursor",
  "GitHub Copilot",
  "DeepSeek-V3",
  "Runway",
  "Canva",
  "Notion AI",
  "ElevenLabs",
];

function typeLabel(type?: string | null) {
  switch (type?.toLowerCase()) {
    case "free":
      return "Бесплатно";
    case "freemium":
      return "Freemium";
    case "paid":
      return "Платный";
    case "opensource":
      return "Open source";
    default:
      return null;
  }
}

function ToolSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950 sm:rounded-3xl">
      <div className="h-28 animate-pulse bg-zinc-100 dark:bg-zinc-900 sm:h-40" />
      <div className="space-y-2 p-3 sm:space-y-3 sm:p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}

export default function PopularToolsSection() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/ai-tools")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load AI tools");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        const data = payload?.success ? payload.data : payload;
        setTools(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setTools([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const popularTools = useMemo(() => {
    const byName = new Map(
      tools.map((tool) => [tool.name.trim().toLocaleLowerCase("ru-RU"), tool]),
    );
    const selected = POPULAR_TOOL_NAMES.map((name) =>
      byName.get(name.toLocaleLowerCase("ru-RU")),
    ).filter((tool): tool is Tool => Boolean(tool));
    const selectedIds = new Set(selected.map((tool) => tool.id));

    const fallback = [...tools]
      .filter((tool) => !selectedIds.has(tool.id))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return [...selected, ...fallback].slice(0, 12);
  }, [tools]);

  return (
    <section id="popular-tools" className="relative overflow-hidden bg-zinc-50 py-20 dark:bg-zinc-950 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/20 to-transparent dark:via-white/20" />
        <div className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/10" />
        <div className="absolute -right-32 bottom-12 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-700/10" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
            <Sparkles className="h-4 w-4" />
            Выбор пользователей
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            Популярные AI-инструменты
          </h2>
          <p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Самые востребованные сервисы для работы, творчества, поиска,
            программирования и создания контента.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <ToolSkeleton key={index} />
            ))}
          </div>
        ) : popularTools.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {popularTools.map((tool) => {
              const pricing = typeLabel(tool.type);

              return (
                <Link
                  key={tool.id}
                  href={`/catalog/${tool.id}`}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-black sm:min-h-[330px] sm:rounded-3xl"
                >
                  <div className="relative h-28 overflow-hidden bg-zinc-100 dark:bg-zinc-900 sm:h-40">
                    <ToolImage
                      src={tool.coverImage}
                      alt={tool.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                    {typeof tool.rating === "number" ? (
                      <div className="absolute right-3 top-3 hidden items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur sm:flex">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {tool.rating.toFixed(1)}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <div className="mb-2 flex items-start justify-between gap-1.5 sm:mb-3 sm:gap-3">
                      <h3 className="line-clamp-2 text-sm font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-xl sm:font-bold">
                        {tool.name}
                      </h3>
                      {typeof tool.rating === "number" ? (
                        <span className="inline-flex shrink-0 items-center rounded-md bg-black px-1.5 py-0.5 text-[9px] font-semibold text-white sm:hidden">
                          {tool.rating.toFixed(1)}
                        </span>
                      ) : null}
                      {pricing ? (
                        <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 sm:inline-flex">
                          {pricing}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400 sm:line-clamp-3 sm:text-sm sm:leading-6">
                      {tool.description || "AI-инструмент для решения повседневных и профессиональных задач."}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs sm:gap-3 sm:pt-5 sm:text-sm">
                      <span className="truncate text-zinc-500 dark:text-zinc-500">
                        {tool.category?.name || "AI-инструмент"}
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 font-semibold text-zinc-950 transition group-hover:gap-2 dark:text-white sm:flex">
                        Подробнее <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-black">
            <p className="text-zinc-600 dark:text-zinc-400">
              Инструменты временно недоступны. Откройте полный каталог и попробуйте ещё раз.
            </p>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Смотреть все инструменты
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
