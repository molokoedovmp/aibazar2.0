import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  BrainCircuit,
  CreditCard,
  Github,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import {
  LibraryResourceCard,
  type LibraryResourceItem,
  type LibraryResourceType as ResourceType,
} from "@/components/library/LibraryResourceCard";

export type FeaturedItem = LibraryResourceItem;

export type FeaturedResponse = {
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
    accentClassName: "bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 text-white shadow-orange-500/25",
    badgeClassName: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  },
  mcp: {
    label: "MCP",
    shortDescription: "Серверы для AI-агентов",
    icon: BrainCircuit,
    href: "/catalog/mcp",
    accentClassName: "bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-600 text-white shadow-sky-500/25",
    badgeClassName: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  prompts: {
    label: "Промпты",
    shortDescription: "Готовые инструкции",
    icon: BookOpenText,
    href: "/catalog/prompts",
    accentClassName: "bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700 text-white shadow-violet-500/25",
    badgeClassName: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
  skills: {
    label: "Навыки",
    shortDescription: "Расширения для агентов",
    icon: WandSparkles,
    href: "/catalog/skills",
    accentClassName: "bg-gradient-to-br from-emerald-300 via-teal-500 to-cyan-700 text-white shadow-teal-500/25",
    badgeClassName: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  },
  repos: {
    label: "Репозитории",
    shortDescription: "Open-source проекты",
    icon: Github,
    href: "/catalog/repos",
    accentClassName: "bg-gradient-to-br from-zinc-600 via-zinc-900 to-black text-white shadow-black/25",
    badgeClassName: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
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

export default function PopularToolsSection({
  payload,
  loading,
  children,
}: {
  payload: FeaturedResponse | null;
  loading: boolean;
  children?: ReactNode;
}) {
  const data = payload?.data || EMPTY_DATA;
  const counts = payload?.counts || EMPTY_COUNTS;

  return (
    <section id="popular-tools" className="relative py-10 text-foreground sm:py-12">

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        {children}
        <Link
          id="payment-help"
          href="/calculator"
          aria-label="Рассчитать стоимость и получить помощь с оплатой AI-сервиса"
          className="group relative grid w-full gap-5 overflow-hidden rounded-[26px] border border-white/10 bg-black bg-[radial-gradient(circle_at_16%_20%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(139,92,246,0.23),transparent_30%),radial-gradient(circle_at_70%_100%,rgba(16,185,129,0.16),transparent_28%)] px-6 py-6 text-white shadow-[0_14px_40px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-8 sm:py-7"
        >
          <span className="theme-light-button flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black transition group-hover:scale-105">
            <CreditCard className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xl font-medium tracking-[-0.025em] text-white sm:text-2xl">
              Оплатить зарубежный AI-сервис
            </span>
            <span className="mt-1.5 block max-w-3xl text-sm leading-6 text-white/60">
              Узнайте стоимость подписки в рублях. Если российская карта не проходит,
              я помогу разобраться с оплатой и покажу весь процесс.
            </span>
          </span>
          <span className="theme-light-button inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition group-hover:bg-zinc-200">
            Рассчитать стоимость
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </Link>

        <div className="mb-10 mt-14 max-w-2xl sm:mt-16">
          <h2 className="text-3xl font-medium tracking-[-0.035em] text-zinc-950 dark:text-white sm:text-4xl">
            Лучшее из AI-библиотеки
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
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
                        <h3 className="truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-xl">
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
                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10 sm:text-sm"
                  >
                    Смотреть все <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
                  {loading
                    ? Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className={index === 4 ? "hidden lg:contents" : "contents"}>
                          <CardSkeleton />
                        </div>
                      ))
                    : data[type].map((item, index, items) => {
                        const isUnpairedMobileCard = items.length % 2 !== 0 && index === items.length - 1;

                        return (
                          <div
                            key={item.id}
                            className={isUnpairedMobileCard ? "hidden lg:contents" : "contents"}
                          >
                            <LibraryResourceCard item={item} type={type} />
                          </div>
                        );
                      })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Открыть всю AI-библиотеку
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
