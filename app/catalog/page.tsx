"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Boxes,
  BrainCircuit,
  Github,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import {
  LibraryResourceCard,
  LIBRARY_RESOURCE_PATHS,
  type LibraryResourceType,
} from "@/components/library/LibraryResourceCard";
import { Input } from "@/components/ui/input";

type ResourceType = LibraryResourceType;
type SortOption = "rating" | "stars" | "newest";

type ResourceCounts = Record<ResourceType, number>;

type LibraryItem = {
  id: string;
  externalId?: string;
  slug?: string;
  name?: string;
  title?: string;
  titleRu?: string | null;
  description?: string | null;
  descriptionRu?: string | null;
  content?: string;
  coverImage?: string | null;
  url?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  repoUrl?: string | null;
  resourceType?: string;
  author?: string | null;
  authorName?: string | null;
  rating?: number | null;
  stars?: number | null;
  views?: number | null;
  downloads?: number | null;
  languageName?: string | null;
  languageIcon?: string | null;
  language?: string | null;
  sourceLanguage?: string | null;
  sourceKind?: string;
  location?: string | null;
  category?: { id: string; name: string; icon?: string | null } | string | null;
  categoryNames?: string[];
  tags?: string[];
  compatibleAgents?: string[];
  installCommand?: string | null;
  isOfficial?: boolean;
  owner?: string | null;
  repositoryName?: string | null;
};

type FilterOption = {
  value: string;
  label: string;
  count: number;
};

type LibraryResponse = {
  success: boolean;
  data: LibraryItem[];
  counts: ResourceCounts;
  filters: FilterOption[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ResourceConfig = {
  label: string;
  shortLabel: string;
  singular: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
  tools: {
    label: "AI-инструменты",
    shortLabel: "AI-инструменты",
    singular: "инструмент",
    description:
      "Каталог нейросетей и AI-сервисов для текста, изображений, видео, кода, аналитики, автоматизации и повседневных задач. Сравнивайте возможности и выбирайте подходящий инструмент.",
    icon: Boxes,
    iconClassName: "from-amber-300 via-orange-400 to-orange-600 shadow-orange-500/25",
  },
  mcp: {
    label: "MCP",
    shortLabel: "MCP",
    singular: "MCP-ресурс",
    description:
      "MCP (Model Context Protocol) — открытый протокол, который подключает AI-агентов к файлам, базам данных, API и рабочим сервисам. Здесь собраны MCP-серверы и клиенты для Claude, Cursor и других совместимых приложений.",
    icon: BrainCircuit,
    iconClassName: "from-cyan-300 via-sky-500 to-blue-600 shadow-sky-500/25",
  },
  prompts: {
    label: "Промпты",
    shortLabel: "Промпты",
    singular: "промпт",
    description:
      "Готовые промпты — это подробные инструкции для нейросетей. Используйте их для создания контента, анализа данных, маркетинга, разработки и других задач или адаптируйте под свой проект.",
    icon: BookOpenText,
    iconClassName: "from-violet-300 via-violet-500 to-indigo-700 shadow-violet-500/25",
  },
  skills: {
    label: "Навыки",
    shortLabel: "Навыки",
    singular: "навык",
    description:
      "Навыки (Skills) — подключаемые инструкции и сценарии, которые обучают AI-агента выполнять специализированные задачи. Они расширяют возможности Claude Code, Codex, Cursor и других ассистентов.",
    icon: WandSparkles,
    iconClassName: "from-emerald-300 via-teal-500 to-cyan-700 shadow-teal-500/25",
  },
  repos: {
    label: "Репозитории",
    shortLabel: "Репозитории",
    singular: "репозиторий",
    description:
      "Репозитории — популярные open-source проекты с открытым исходным кодом: AI-приложения, библиотеки, агенты и инструменты для разработки, которые можно изучить, запустить или использовать в своём проекте.",
    icon: Github,
    iconClassName: "from-zinc-600 via-zinc-900 to-black shadow-black/25",
  },
};

const RESOURCE_TYPES = Object.keys(RESOURCE_CONFIG) as ResourceType[];

function resourceTypeFromPathname(pathname: string): ResourceType | null {
  if (pathname === "/catalog/mcp") return "mcp";
  if (pathname === "/catalog/prompts") return "prompts";
  if (pathname === "/catalog/skills") return "skills";
  if (pathname === "/catalog/repos") return "repos";
  return null;
}

function defaultSort(type: ResourceType): SortOption {
  return type === "tools" || type === "prompts" ? "rating" : "stars";
}

function sortOptions(type: ResourceType): SortOption[] {
  if (type === "tools" || type === "prompts") return ["rating", "newest"];
  if (type === "mcp") return ["stars", "rating", "newest"];
  return ["stars", "newest"];
}

function ResourceIcon({ type, className = "h-8 w-8" }: { type: ResourceType; className?: string }) {
  const config = RESOURCE_CONFIG[type];
  const Icon = config.icon;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br text-white shadow-lg ring-1 ring-black/5 ${config.iconClassName} ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />
      <Icon className="relative z-10 h-[48%] w-[48%] drop-shadow-sm" strokeWidth={2.2} />
    </span>
  );
}

const FILTER_TRANSLATIONS: Record<string, string> = {
  anthropic: "Anthropic",
  fabric: "Fabric",
  user: "Сообщество",
  coding: "Разработка",
  security: "Безопасность",
  design: "Дизайн",
  automation: "Автоматизация",
  productivity: "Продуктивность",
  infrastructure: "Инфраструктура",
  performance: "Производительность",
  "developer-tools": "Инструменты разработчика",
  "other-tools-and-integrations": "Другие инструменты и интеграции",
  "finance-fintech": "Финансы и финтех",
  databases: "Базы данных",
  "search-data-extraction": "Поиск и извлечение данных",
  "cloud-platforms": "Облачные платформы",
  communication: "Коммуникации",
  "knowledge-memory": "Знания и память",
  "browser-automation": "Автоматизация браузера",
  aggregators: "Агрегаторы",
  "art-culture": "Искусство и культура",
  "location-services": "Геолокационные сервисы",
  "coding-agents": "Агенты для программирования",
  "data-science-tools": "Инструменты Data Science",
  "command-line": "Командная строка",
  monitoring: "Мониторинг",
  "file-systems": "Файловые системы",
  "biology-medicine-and-bioinformatics": "Биология, медицина и биоинформатика",
  gaming: "Игры",
  "data-platforms": "Платформы данных",
  "travel-transportation": "Путешествия и транспорт",
  "version-control": "Контроль версий",
  "workplace-productivity": "Продуктивность на работе",
  marketing: "Маркетинг",
  "code-execution": "Выполнение кода",
  "social-media": "Социальные сети",
  sports: "Спорт",
  "customer-data-platforms": "Платформы клиентских данных",
  "multimedia-process": "Обработка мультимедиа",
  "support-service-management": "Поддержка и управление сервисами",
  "embedded-system": "Встраиваемые системы",
  "text-to-speech": "Синтез речи",
  "architecture-design": "Архитектура и дизайн",
  "end-to-end-rag-platforms": "Комплексные RAG-платформы",
  research: "Исследования",
  "translation-services": "Сервисы перевода",
  "aerospace-astrodynamics": "Аэрокосмос и астродинамика",
  delivery: "Доставка",
  legal: "Юридические сервисы",
};

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value.toLocaleString("ru-RU");
}

function filterLabel(option: FilterOption) {
  return FILTER_TRANSLATIONS[option.value] || FILTER_TRANSLATIONS[option.label] || option.label;
}

function filterPlaceholder(type: ResourceType) {
  if (type === "tools") return "Все категории";
  if (type === "mcp") return "Все направления";
  if (type === "prompts") return "Все источники";
  if (type === "skills") return "Все категории";
  return "Все языки";
}

function resultWord(type: ResourceType, count: number) {
  if (type === "mcp") return "MCP-ресурсов";
  if (type === "prompts") return count % 10 === 1 && count % 100 !== 11 ? "промпт" : "промптов";
  if (type === "skills") return "навыков";
  if (type === "repos") return "репозиториев";
  return "инструментов";
}

export default function CatalogPage() {
  const pathname = usePathname();
  const [activeType, setActiveType] = useState<ResourceType>(() => resourceTypeFromPathname(pathname) || "tools");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("rating");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [counts, setCounts] = useState<ResourceCounts>({
    tools: 0,
    mcp: 0,
    prompts: 0,
    skills: 0,
    repos: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedType = params.get("type");
    const pathType = resourceTypeFromPathname(pathname);
    const type = pathType || (requestedType && RESOURCE_TYPES.includes(requestedType as ResourceType)
      ? requestedType as ResourceType
      : "tools");
    const requestedSort = params.get("sort") as SortOption | null;
    const initialQuery = params.get("q")?.trim() || "";
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
    setActiveType(type);
    setActiveFilter("");
    setPage(1);
    setSort(requestedSort && sortOptions(type).includes(requestedSort) ? requestedSort : defaultSort(type));
  }, [pathname]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      type: activeType,
      page: String(page),
      limit: "30",
    });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeFilter) params.set("filter", activeFilter);
    params.set("sort", sort);

    setLoading(true);
    setError("");

    fetch(`/api/library?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Library request failed");
        return (await response.json()) as LibraryResponse;
      })
      .then((payload) => {
        if (!payload.success) throw new Error("Library request failed");
        setItems(payload.data || []);
        setFilters(payload.filters || []);
        setCounts(payload.counts);
        setTotal(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setItems([]);
        setError("Не удалось загрузить раздел. Попробуйте обновить страницу.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [activeType, activeFilter, debouncedQuery, page, sort]);

  const currentConfig = RESOURCE_CONFIG[activeType];
  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [page, totalPages]);
  const activeFilterTitle = useMemo(() => {
    if (!activeFilter) return "";
    const option = filters.find((filter) => filter.value === activeFilter);
    return option ? filterLabel(option) : activeFilter;
  }, [activeFilter, filters]);

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-black dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />

      <div className="grid w-full grid-cols-1 md:grid-cols-[240px_1px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-transparent md:block">
          <nav className="space-y-1 px-2 pb-2 pt-5">
            {RESOURCE_TYPES.map((type) => {
              const config = RESOURCE_CONFIG[type];
              const active = type === activeType;
              return (
                <Link
                  key={type}
                  href={LIBRARY_RESOURCE_PATHS[type]}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-black text-white"
                      : "text-black/75 hover:bg-black/5 hover:text-black dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  <ResourceIcon type={type} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{config.label}</span>
                  <span className={`text-xs ${active ? "text-white/65" : "text-black/50 dark:text-white/65"}`}>
                    {counts[type] ? formatNumber(counts[type]) : "—"}
                  </span>
                </Link>
              );
            })}
          </nav>

          {filters.length > 0 && (
            <div className="mt-3 border-t border-black/10 px-2 pb-8 pt-4 dark:border-white/15">
              <div className="mb-2 whitespace-nowrap px-3 text-[9px] font-medium uppercase tracking-[0.14em] text-black/50 dark:text-white/60">
                Категории и направления
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("");
                  setPage(1);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                  !activeFilter
                    ? "bg-black/5 font-semibold dark:bg-white/10 dark:text-white"
                    : "text-black/75 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/10"
                }`}
              >
                {filterPlaceholder(activeType)}
              </button>
              {filters.slice(0, 40).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setActiveFilter(option.value);
                    setPage(1);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${
                    activeFilter === option.value
                      ? "bg-black text-white"
                      : "text-black/75 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/10"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{filterLabel(option)}</span>
                  <span className={activeFilter === option.value ? "text-white/60" : "text-black/45 dark:text-white/55"}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="sticky top-0 hidden h-screen bg-black/15 dark:bg-white/15 md:block" />

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="contents md:block md:overflow-hidden md:rounded-3xl md:border md:border-black/10 md:bg-white md:shadow-sm md:dark:border-white/10 md:dark:bg-zinc-900">
          <section className="relative min-h-[280px] overflow-hidden rounded-3xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900 sm:min-h-[320px] md:rounded-none md:border-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ai-hero.png" alt="AI-библиотека" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
            <div className="relative flex min-h-[280px] max-w-4xl flex-col justify-center px-6 py-10 text-white sm:min-h-[320px] sm:px-10">
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Всё для работы с AI
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-5xl">{currentConfig.label}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                {currentConfig.description}
              </p>
            </div>
          </section>

          <div className="mt-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-0 md:px-4 md:pt-4">
            <div className="grid min-w-[680px] grid-cols-5 gap-2">
              {RESOURCE_TYPES.map((type) => {
                const config = RESOURCE_CONFIG[type];
                const active = activeType === type;
                return (
                  <Link
                    key={type}
                    href={LIBRARY_RESOURCE_PATHS[type]}
                    aria-pressed={active}
                    className={`flex min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                      active
                        ? "border-black bg-black text-white shadow-sm ring-1 ring-black/10 dark:border-white/20"
                        : "border-black/10 bg-white hover:border-black/25 hover:bg-black/[0.02]"
                    }`}
                  >
                    <ResourceIcon type={type} className="h-8 w-8" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold sm:text-sm">{config.shortLabel}</span>
                      <span className={`block text-[10px] sm:text-xs ${active ? "text-white/60" : "text-black/40"}`}>
                        {counts[type] ? formatNumber(counts[type]) : "—"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <section className="sticky top-0 z-30 mt-4 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 md:static md:mx-4 md:mb-4 md:mt-3 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none md:dark:bg-transparent">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Поиск: ${currentConfig.label.toLocaleLowerCase("ru-RU")}…`}
                  className="h-11 w-full rounded-xl border-black/10 bg-[#fafafa] pl-9 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value);
                  setPage(1);
                }}
                className="h-11 w-[38%] max-w-[180px] shrink-0 truncate rounded-xl border border-black/10 bg-white px-2 text-xs outline-none sm:w-60 sm:max-w-none sm:px-3 sm:text-sm"
                aria-label="Фильтр"
              >
                <option value="">{filterPlaceholder(activeType)}</option>
                {filters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {filterLabel(option)} ({option.count})
                  </option>
                ))}
              </select>
            </div>
          </section>
          </div>

          <section className="mt-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              {activeFilterTitle ? (
                <h2 className="text-lg font-semibold tracking-[-0.02em] sm:text-xl">{activeFilterTitle}</h2>
              ) : null}
              <div className="ml-auto text-xs text-black/45">
                {loading ? "Загрузка…" : `${formatNumber(total) || 0} ${resultWord(activeType, total)}`}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
                {error}
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
                {Array.from({ length: 12 }, (_, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-black/10">
                    <div className="h-28 animate-pulse bg-black/5 sm:h-40" />
                    <div className="space-y-3 p-3 sm:p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-black/10" />
                      <div className="h-3 w-full animate-pulse rounded bg-black/5" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-black/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center">
                <Search className="mx-auto h-6 w-6 text-black/30" />
                <p className="mt-3 text-sm text-black/55">По вашему запросу ничего не найдено.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
                {items.map((item) => (
                  <LibraryResourceCard key={item.id} item={item} type={activeType} />
                ))}
              </div>
            )}

            {!loading && !error && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="h-9 rounded-lg border border-black/10 px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Назад
                </button>
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold ${
                      pageNumber === page ? "bg-black text-white" : "border border-black/10 hover:bg-black/5"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  className="h-9 rounded-lg border border-black/10 px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Далее
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      <div className="border-t border-black/10 dark:border-white/10">
        <Footer />
      </div>
    </div>
  );
}
