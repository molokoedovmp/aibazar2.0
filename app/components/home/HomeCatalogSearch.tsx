"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Boxes,
  BrainCircuit,
  Github,
  LoaderCircle,
  Search,
  Star,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { ToolImage } from "@/app/components/ToolImage";
import BlurText from "@/components/ui/blur-text";

type ResourceType = "tools" | "mcp" | "prompts" | "skills" | "repos";

type SearchResult = {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  href: string;
  coverImage: string | null;
  rating: number | null;
  stars: number | null;
};

type SearchResponse = {
  success: boolean;
  data?: SearchResult[];
};

const TYPE_META: Record<ResourceType, { label: string; icon: LucideIcon }> = {
  tools: { label: "AI-инструмент", icon: Boxes },
  mcp: { label: "MCP-сервер", icon: BrainCircuit },
  prompts: { label: "Промпт", icon: BookOpenText },
  skills: { label: "Навык", icon: WandSparkles },
  repos: { label: "Репозиторий", icon: Github },
};

function formatMetric(result: SearchResult) {
  if (result.type === "tools" && result.rating) return result.rating.toFixed(1);
  if (result.stars) return result.stars.toLocaleString("ru-RU");
  if (result.rating) return result.rating.toFixed(1);
  return null;
}

function ResultCard({ result }: { result: SearchResult }) {
  const meta = TYPE_META[result.type];
  const Icon = meta.icon;
  const metric = formatMetric(result);

  return (
    <Link
      href={result.href}
      className="group flex min-w-0 gap-3 rounded-2xl border border-black/10 bg-white/75 p-3 text-left shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-white dark:border-white/10 dark:bg-zinc-900/90 dark:hover:border-white/25 dark:hover:bg-zinc-800 sm:p-4"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-black/[0.035] dark:border-white/10 dark:bg-white/[0.06]">
        {result.coverImage ? (
          <ToolImage
            src={result.coverImage}
            alt=""
            className="h-full w-full object-cover"
            fallbackTextClassName="text-xs"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon className="h-5 w-5 text-black/55 dark:text-white/60" />
          </span>
        )}
      </div>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold text-foreground sm:text-base">
            {result.title}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </span>
        <span className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {result.description}
        </span>
        <span className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground sm:text-xs">
          <span>{meta.label}</span>
          {metric ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-amber-500" />
              {metric}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

export function HomeCatalogSearch({ totalItems = 0 }: { totalItems?: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults([]);
      setSearchedQuery("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/library/search?q=${encodeURIComponent(normalizedQuery)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("Search failed");
          return response.json() as Promise<SearchResponse>;
        })
        .then((payload) => {
          setResults(payload.success ? payload.data || [] : []);
          setSearchedQuery(normalizedQuery);
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setResults([]);
            setSearchedQuery(normalizedQuery);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 280);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery]);

  return (
    <section aria-labelledby="home-search-title" className="pb-10 pt-5 text-foreground sm:pb-14 sm:pt-10">
      <div className="mx-auto w-full max-w-5xl text-center">
        <BlurText
          id="home-search-title"
          as="h1"
          text="Найдите AI-инструмент под свою задачу"
          animateBy="words"
          direction="top"
          delay={240}
          stepDuration={0.55}
          className="mx-auto max-w-4xl justify-center text-center text-3xl font-medium leading-tight tracking-[-0.035em] sm:text-5xl lg:text-6xl"
        />
        <p className="mx-auto mt-5 max-w-3xl text-justify text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          Нейросети, MCP-серверы, промпты, навыки и open-source проекты — с понятными
          описаниями, рейтингами и быстрым поиском.
        </p>
        {totalItems > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            В каталоге уже {totalItems.toLocaleString("ru-RU")} AI-инструментов и ресурсов
          </p>
        ) : null}

        <form
          role="search"
          className="mx-auto mt-8 max-w-4xl"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="flex h-16 min-w-0 items-center gap-3 rounded-2xl border border-black/15 bg-white/85 px-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-md focus-within:border-cyan-600/70 focus-within:ring-2 focus-within:ring-cyan-600/20 dark:border-white/20 dark:bg-zinc-900/90 dark:shadow-[0_18px_60px_rgba(0,0,0,0.28)] dark:focus-within:border-cyan-300/70 dark:focus-within:ring-cyan-300/20 sm:h-[72px]">
            {loading ? (
              <LoaderCircle aria-hidden className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <label htmlFor="home-catalog-search" className="sr-only">
              Название или описание ресурса
            </label>
            <input
              id="home-catalog-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="text"
              inputMode="search"
              maxLength={120}
              autoComplete="off"
              placeholder="Например: генерация видео, Claude или MCP для GitHub"
              className="h-full w-full min-w-0 !bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground sm:text-base"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Очистить поиск"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>

        {normalizedQuery.length === 1 ? (
          <p className="mt-3 text-xs text-muted-foreground">Введите ещё один символ для поиска</p>
        ) : null}
      </div>

      {normalizedQuery.length >= 2 ? (
        <div className="mx-auto mt-6 w-full max-w-5xl" aria-live="polite">
          {!loading && searchedQuery === normalizedQuery && results.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/60 px-5 py-8 text-center text-sm text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-black/20">
              По запросу «{normalizedQuery}» ничего не найдено
            </div>
          ) : null}

          {results.length > 0 && searchedQuery === normalizedQuery ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
                <span>Результаты по запросу «{searchedQuery}»</span>
                <span>{results.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.map((result) => (
                  <ResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
