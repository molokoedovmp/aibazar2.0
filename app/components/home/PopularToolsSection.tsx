"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  BrainCircuit,
  Github,
  Sparkles,
  Star,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { ToolImage } from "@/app/components/ToolImage";
import FavoriteButton from "@/components/FavoriteButton";

type ResourceType = "tools" | "mcp" | "prompts" | "skills" | "repos";

type FeaturedItem = {
  id: string;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
  titleRu?: string | null;
  description?: string | null;
  descriptionRu?: string | null;
  coverImage?: string | null;
  rating?: number | null;
  stars?: number | null;
  sourceKind?: string | null;
  languageName?: string | null;
  language?: string | null;
  category?: string | { name: string } | null;
};

type FeaturedResponse = {
  success: boolean;
  data: Record<ResourceType, FeaturedItem[]>;
  counts: Record<ResourceType, number>;
};

type ResourceConfig = {
  label: string;
  shortDescription: string;
  icon: LucideIcon;
  href: string;
  accentClassName: string;
  badgeClassName: string;
};

const RESOURCE_TYPES: ResourceType[] = ["tools", "mcp", "prompts", "skills", "repos"];

const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
  tools: {
    label: "AI-инструменты",
    shortDescription: "Нейросети и сервисы",
    icon: Boxes,
    href: "/catalog?type=tools",
    accentClassName: "bg-black text-white",
    badgeClassName: "bg-black/5 text-black",
  },
  mcp: {
    label: "MCP",
    shortDescription: "Серверы для AI-агентов",
    icon: BrainCircuit,
    href: "/catalog?type=mcp",
    accentClassName: "bg-emerald-500 text-white",
    badgeClassName: "bg-emerald-50 text-emerald-700",
  },
  prompts: {
    label: "Промпты",
    shortDescription: "Готовые инструкции",
    icon: BookOpenText,
    href: "/catalog?type=prompts",
    accentClassName: "bg-rose-500 text-white",
    badgeClassName: "bg-rose-50 text-rose-700",
  },
  skills: {
    label: "Навыки",
    shortDescription: "Расширения для агентов",
    icon: WandSparkles,
    href: "/catalog?type=skills",
    accentClassName: "bg-violet-500 text-white",
    badgeClassName: "bg-violet-50 text-violet-700",
  },
  repos: {
    label: "Репозитории",
    shortDescription: "Open-source проекты",
    icon: Github,
    href: "/catalog?type=repos",
    accentClassName: "bg-amber-500 text-white",
    badgeClassName: "bg-amber-50 text-amber-800",
  },
};

const EMPTY_DATA: Record<ResourceType, FeaturedItem[]> = {
  tools: [],
  mcp: [],
  prompts: [],
  skills: [],
  repos: [],
};

const EMPTY_COUNTS: Record<ResourceType, number> = {
  tools: 0,
  mcp: 0,
  prompts: 0,
  skills: 0,
  repos: 0,
};

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

function itemTitle(item: FeaturedItem) {
  return item.titleRu || item.title || item.name || "Без названия";
}

function itemDescription(item: FeaturedItem) {
  return item.descriptionRu || item.description || "Описание скоро появится.";
}

function itemMeta(item: FeaturedItem, type: ResourceType) {
  if (type === "tools") {
    return typeof item.category === "object" ? item.category?.name : "AI-инструмент";
  }
  if (type === "mcp") return item.languageName || "MCP Server";
  if (type === "prompts") return item.sourceKind || "Готовый промпт";
  if (type === "skills") return typeof item.category === "string" ? item.category : "Навык агента";
  return item.language || "Open source";
}

function itemHref(item: FeaturedItem, type: ResourceType) {
  if (type === "tools") return `/catalog/${item.id}`;
  if (type === "mcp" && item.slug) return `/catalog/mcp/${item.slug}`;
  return RESOURCE_CONFIG[type].href;
}

function itemMetric(item: FeaturedItem) {
  if (typeof item.rating === "number" && item.rating > 0) return item.rating.toFixed(1);
  if (typeof item.stars === "number" && item.stars > 0) return formatNumber(item.stars);
  return null;
}

function CardSkeleton() {
  return (
    <div className="min-h-[190px] rounded-2xl border border-black/10 bg-white p-3 sm:min-h-[220px] sm:p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-black/10 sm:h-12 sm:w-12" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-black/10" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-black/5" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-black/5" />
      </div>
    </div>
  );
}

function initials(value: string) {
  const normalized = value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "AI").slice(0, 2).toUpperCase();
}

function FeaturedCard({ item, type }: { item: FeaturedItem; type: ResourceType }) {
  const config = RESOURCE_CONFIG[type];
  const metric = itemMetric(item);
  const title = itemTitle(item);
  const favoriteType = type === "tools" ? "aiTools" : type;
  const href = itemHref(item, type);

  return (
    <article
      className="group relative flex min-h-[190px] min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-xl dark:border-white/10 dark:bg-black sm:min-h-[220px] sm:p-4"
    >
      <FavoriteButton
        toolId={item.id}
        itemType={favoriteType}
        iconOnly
        callbackUrl={href}
        className="absolute right-3 top-3 z-20 h-8 w-8"
      />
      <Link href={href} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-w-0 items-start gap-2.5 pr-9 sm:gap-3">
        {type === "tools" ? (
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-black/5 sm:h-12 sm:w-12">
            <ToolImage
              src={item.coverImage}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              fallbackTextClassName="px-1 text-[8px]"
            />
          </div>
        ) : (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition group-hover:scale-105 sm:h-12 sm:w-12 sm:text-sm ${config.accentClassName}`}>
            {initials(title)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={`max-w-full truncate rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide sm:text-[9px] ${config.badgeClassName}`}>
              {config.label}
            </span>
            {metric ? (
              <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[9px] font-semibold text-black/45 dark:text-white/45 sm:text-[10px]">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                {metric}
              </span>
            ) : null}
          </div>
          <h4 className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-zinc-950 dark:text-white sm:text-sm sm:leading-5">
            {title}
          </h4>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400 sm:text-xs sm:leading-5">
        {itemDescription(item)}
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <span className="max-w-[78%] truncate rounded-md border border-black/10 bg-black/[0.025] px-2 py-1 text-[9px] text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55 sm:text-[10px]">
          {itemMeta(item, type)}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-black/30 transition group-hover:translate-x-1 group-hover:text-black dark:text-white/30 dark:group-hover:text-white" />
      </div>
      </Link>
    </article>
  );
}

export default function PopularToolsSection() {
  const [data, setData] = useState(EMPTY_DATA);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/library/featured")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load featured resources");
        return response.json() as Promise<FeaturedResponse>;
      })
      .then((payload) => {
        if (!active || !payload.success) return;
        setData(payload.data);
        setCounts(payload.counts);
      })
      .catch(() => {
        if (active) {
          setData(EMPTY_DATA);
          setCounts(EMPTY_COUNTS);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="popular-tools" className="relative overflow-hidden bg-zinc-50 py-20 dark:bg-zinc-950 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/20 to-transparent dark:via-white/20" />
        <div className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/10" />
        <div className="absolute -right-32 bottom-12 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-700/10" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
            <Sparkles className="h-4 w-4" />
            Лучшее в каталоге
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Лучшее из AI-библиотеки
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Популярные ресурсы из каждого раздела нашей AI-библиотеки.
          </p>
        </div>

        <div className="space-y-12 sm:space-y-16">
          {RESOURCE_TYPES.map((type) => {
            const config = RESOURCE_CONFIG[type];
            const Icon = config.icon;

            return (
              <section key={type}>
                <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.accentClassName}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="truncate text-lg font-bold tracking-tight text-zinc-950 dark:text-white sm:text-xl">
                          {config.label}
                        </h3>
                        <span className="text-xs font-medium text-black/35 dark:text-white/35">
                          {formatNumber(counts[type])}
                        </span>
                      </div>
                      <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block">{config.shortDescription}</p>
                    </div>
                  </div>

                  <Link
                    href={config.href}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-black transition hover:gap-2 dark:text-white sm:text-sm"
                  >
                    Смотреть все <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
                  {loading
                    ? Array.from({ length: 5 }, (_, index) => <CardSkeleton key={index} />)
                    : data[type].map((item) => <FeaturedCard key={item.id} item={item} type={type} />)}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Открыть всю AI-библиотеку
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
