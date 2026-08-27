"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Boxes,
  BrainCircuit,
  Check,
  Copy,
  ExternalLink,
  Github,
  LibraryBig,
  Search,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { ToolImage } from "@/app/components/ToolImage";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import FavoriteButton from "@/components/FavoriteButton";

type ResourceType = "tools" | "mcp" | "prompts" | "skills" | "repos";

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
};

const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
  tools: {
    label: "AI-инструменты",
    shortLabel: "AI-инструменты",
    singular: "инструмент",
    description: "Сервисы и нейросети для работы, творчества и бизнеса",
    icon: Boxes,
  },
  mcp: {
    label: "MCP",
    shortLabel: "MCP",
    singular: "MCP-ресурс",
    description: "Серверы и клиенты Model Context Protocol для AI-агентов",
    icon: BrainCircuit,
  },
  prompts: {
    label: "Промпты",
    shortLabel: "Промпты",
    singular: "промпт",
    description: "Готовые инструкции для решения задач с помощью нейросетей",
    icon: BookOpenText,
  },
  skills: {
    label: "Навыки",
    shortLabel: "Навыки",
    singular: "навык",
    description: "Расширения возможностей Claude Code, Codex, Cursor и других агентов",
    icon: WandSparkles,
  },
  repos: {
    label: "Репозитории",
    shortLabel: "Репозитории",
    singular: "репозиторий",
    description: "Актуальные open-source проекты для разработки с AI",
    icon: Github,
  },
};

const RESOURCE_TYPES = Object.keys(RESOURCE_CONFIG) as ResourceType[];

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

function itemName(item: LibraryItem) {
  return item.name || item.title || "Без названия";
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

function ResourceImage({ item, type }: { item: LibraryItem; type: ResourceType }) {
  return (
    <ToolImage
      src={type === "tools" ? item.coverImage : null}
      alt={itemName(item)}
      className="h-28 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-40"
      fallbackTextClassName="px-3 text-base sm:text-xl"
    />
  );
}

function PromptResourceCard({
  item,
  copied,
  onCopy,
}: {
  item: LibraryItem;
  copied: boolean;
  onCopy: (value: string, id: string) => void;
}) {
  const source = FILTER_TRANSLATIONS[item.sourceKind || ""] || item.sourceKind || "Сообщество";
  const title = item.titleRu || itemName(item);

  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-violet-950/10 bg-[linear-gradient(145deg,#ffffff_0%,#faf8ff_100%)] p-3 transition hover:-translate-y-0.5 hover:border-violet-500/25 hover:shadow-lg sm:min-h-[280px] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 sm:h-10 sm:w-10">
          <BookOpenText className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="max-w-[100px] truncate rounded-full border border-violet-200 bg-white px-2 py-1 text-[9px] font-medium text-violet-700 sm:text-[10px]">
            {source}
          </span>
          <FavoriteButton
            toolId={item.id}
            itemType="prompts"
            iconOnly
            callbackUrl="/catalog?type=prompts"
            className="h-8 w-8"
          />
        </div>
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 sm:text-base">{title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-black/55 sm:text-sm">
        {item.descriptionRu || item.description || "Описание пока не добавлено."}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(item.tags || []).slice(0, 2).map((tag) => (
          <span key={tag} className="max-w-full truncate rounded-full bg-violet-100/70 px-2 py-1 text-[9px] text-violet-800 sm:text-[10px]">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="min-w-0 truncate text-[10px] text-black/40 sm:text-xs">
          {item.authorName || "Готовый промпт"}
        </span>
        {item.content && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-violet-700 px-2 text-[9px] font-semibold text-white transition hover:bg-violet-600 sm:gap-1.5 sm:px-3 sm:text-xs"
              >
                <BookOpenText className="h-3.5 w-3.5" />
                Показать промпт
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-h-[88vh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription asChild>
                <div className="min-h-0 overflow-y-auto rounded-xl border border-black/10 bg-black/[0.03] p-4 text-left">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-black/75 sm:text-sm">
                    {item.content}
                  </pre>
                </div>
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Закрыть</AlertDialogCancel>
                <button
                  type="button"
                  onClick={() => onCopy(item.content || "", item.id)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-violet-700 px-4 text-sm font-medium text-white transition hover:bg-violet-600"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </article>
  );
}

function SkillResourceCard({
  item,
  copied,
  onCopy,
}: {
  item: LibraryItem;
  copied: boolean;
  onCopy: (value: string, id: string) => void;
}) {
  const category = FILTER_TRANSLATIONS[String(item.category || "")] || String(item.category || "Навык");

  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-emerald-950/10 bg-[linear-gradient(145deg,#ffffff_0%,#f5fcf8_100%)] p-3 transition hover:-translate-y-0.5 hover:border-emerald-500/25 hover:shadow-lg sm:min-h-[320px] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 sm:h-10 sm:w-10">
          <WandSparkles className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {typeof item.stars === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-black/60 ring-1 ring-black/5 sm:text-[10px]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {formatNumber(item.stars)}
            </span>
          )}
          <FavoriteButton
            toolId={item.id}
            itemType="skills"
            iconOnly
            callbackUrl="/catalog?type=skills"
            className="h-8 w-8"
          />
        </div>
      </div>
      <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700/70 sm:text-[10px]">
        {category}
      </div>
      <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-5 sm:text-base">{itemName(item)}</h3>
      <p className="mt-2 line-clamp-4 text-xs leading-5 text-black/55 sm:text-sm">
        {item.descriptionRu || item.description || "Описание пока не добавлено."}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[item.sourceLanguage, ...(item.compatibleAgents || []).slice(0, 2)]
          .filter((value): value is string => Boolean(value))
          .map((value) => (
            <span key={value} className="max-w-full truncate rounded-full bg-emerald-100/70 px-2 py-1 text-[9px] text-emerald-900/70 sm:text-[10px]">
              {value}
            </span>
          ))}
      </div>
      {item.installCommand && (
        <div className="mt-3 truncate rounded-lg bg-black/[0.04] px-2.5 py-2 font-mono text-[9px] text-black/50 sm:text-[10px]">
          {item.installCommand}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="truncate text-[10px] text-black/40 sm:text-xs">{item.author || "Сообщество"}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.installCommand && (
            <button
              type="button"
              onClick={() => onCopy(item.installCommand || "", item.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 text-[10px] font-semibold text-white transition hover:bg-emerald-600 sm:px-3 sm:text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Скопировано" : "Установить"}</span>
            </button>
          )}
          {item.repoUrl && (
            <a
              href={item.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Открыть репозиторий ${itemName(item)}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white transition hover:bg-black/5"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function RepositoryResourceCard({ item }: { item: LibraryItem }) {
  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-slate-950/10 bg-[linear-gradient(145deg,#ffffff_0%,#f6f8fa_100%)] p-3 transition hover:-translate-y-0.5 hover:border-slate-500/30 hover:shadow-lg sm:min-h-[300px] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white sm:h-10 sm:w-10">
          <Github className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200 sm:text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {formatNumber(item.stars) || 0}
            <span className="hidden font-medium text-amber-700/70 sm:inline">звёзд</span>
          </span>
          <FavoriteButton
            toolId={item.id}
            itemType="repos"
            iconOnly
            callbackUrl="/catalog?type=repos"
            className="h-8 w-8"
          />
        </div>
      </div>
      <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/35 sm:text-[10px]">
        Репозиторий
      </div>
      <h3 className="mt-1.5 line-clamp-2 break-all text-sm font-semibold leading-5 sm:text-base">{itemName(item)}</h3>
      <p className="mt-3 line-clamp-5 text-xs leading-5 text-black/55 sm:text-sm">
        {item.descriptionRu || item.description || "Описание пока не добавлено."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <div className="flex min-w-0 items-center gap-2 text-[10px] text-black/45 sm:text-xs">
          {item.language && (
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
              {item.language}
            </span>
          )}
          {item.owner && <span className="truncate">{item.owner}</span>}
        </div>
        <a
          href={item.url || item.repoUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 text-[10px] font-semibold text-white transition hover:bg-slate-700 sm:px-3 sm:text-xs"
        >
          Открыть
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

export default function CatalogPage() {
  const [activeType, setActiveType] = useState<ResourceType>("tools");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    if (type && RESOURCE_TYPES.includes(type as ResourceType)) {
      setActiveType(type as ResourceType);
    }
  }, []);

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
      limit: "24",
    });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (activeFilter) params.set("filter", activeFilter);

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
  }, [activeType, activeFilter, debouncedQuery, page]);

  const currentConfig = RESOURCE_CONFIG[activeType];
  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [page, totalPages]);

  function selectType(type: ResourceType) {
    setActiveType(type);
    setActiveFilter("");
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set("type", type);
    url.searchParams.delete("filter");
    url.searchParams.delete("page");
    window.history.replaceState({}, "", url);
  }

  async function copyValue(value: string, id: string) {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-black">
      <Navbar />

      <div className="grid w-full grid-cols-1 md:grid-cols-[240px_1px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-white md:block">
          <div className="px-4 pb-2 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LibraryBig className="h-4 w-4" />
              AI-библиотека
            </div>
          </div>

          <nav className="space-y-1 px-2 py-2">
            {RESOURCE_TYPES.map((type) => {
              const config = RESOURCE_CONFIG[type];
              const Icon = config.icon;
              const active = type === activeType;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectType(type)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active ? "bg-black text-white" : "text-black/70 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm">{config.label}</span>
                  <span className={`text-xs ${active ? "text-white/65" : "text-black/40"}`}>
                    {counts[type] ? formatNumber(counts[type]) : "—"}
                  </span>
                </button>
              );
            })}
          </nav>

          {filters.length > 0 && (
            <div className="mt-3 border-t border-black/10 px-2 pb-8 pt-4">
              <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-black/40">
                Фильтры
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("");
                  setPage(1);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                  !activeFilter ? "bg-black/5 font-semibold" : "hover:bg-black/5"
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
                    activeFilter === option.value ? "bg-black text-white" : "hover:bg-black/5"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{filterLabel(option)}</span>
                  <span className={activeFilter === option.value ? "text-white/60" : "text-black/35"}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="sticky top-0 hidden h-screen bg-black/10 md:block" />

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <section className="relative min-h-[230px] overflow-hidden rounded-3xl border border-black/10 bg-white sm:min-h-[260px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ai-hero.png" alt="AI-библиотека" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/35" />
            <div className="relative flex min-h-[230px] max-w-3xl flex-col justify-center px-6 py-10 sm:min-h-[260px] sm:px-10">
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Всё для работы с AI
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-5xl">AI-библиотека</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-black/60 sm:text-base">
                Инструменты, MCP-серверы, готовые промпты, навыки агентов и open-source
                репозитории — на одной странице.
              </p>
            </div>
          </section>

          <div className="mt-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid min-w-[620px] grid-cols-5 gap-2">
              {RESOURCE_TYPES.map((type) => {
                const config = RESOURCE_CONFIG[type];
                const Icon = config.icon;
                const active = activeType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectType(type)}
                    className={`flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                      active
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-black/10 bg-white hover:border-black/25"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold sm:text-sm">{config.shortLabel}</span>
                      <span className={`block text-[10px] sm:text-xs ${active ? "text-white/60" : "text-black/40"}`}>
                        {counts[type] ? formatNumber(counts[type]) : "—"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="mt-4 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
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

          <section className="mt-5 rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">{currentConfig.label}</h2>
                <p className="mt-1 text-sm text-black/50">{currentConfig.description}</p>
              </div>
              <div className="text-xs text-black/45">
                {loading ? "Загрузка…" : `${formatNumber(total) || 0} ${resultWord(activeType, total)}`}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
                {error}
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) =>
                  activeType === "tools" ? (
                    <Link
                      key={item.id}
                      href={`/catalog/${item.id}`}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[320px]"
                    >
                      <ResourceImage item={item} type={activeType} />
                      <div className="flex flex-1 flex-col p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-semibold sm:text-base">{itemName(item)}</h3>
                          {typeof item.rating === "number" && (
                            <span className="shrink-0 rounded-md bg-black px-1.5 py-0.5 text-[9px] font-semibold text-white sm:text-[10px]">
                              {item.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/55 sm:text-sm">
                          {item.description || "AI-инструмент для решения рабочих и творческих задач."}
                        </p>
                        <div className="mt-auto pt-3 text-xs text-black/45">
                          {typeof item.category === "object" ? item.category?.name : "AI-инструмент"}
                        </div>
                      </div>
                    </Link>
                  ) : activeType === "prompts" ? (
                    <PromptResourceCard
                      key={item.id}
                      item={item}
                      copied={copiedId === item.id}
                      onCopy={copyValue}
                    />
                  ) : activeType === "skills" ? (
                    <SkillResourceCard
                      key={item.id}
                      item={item}
                      copied={copiedId === item.id}
                      onCopy={copyValue}
                    />
                  ) : activeType === "repos" ? (
                    <RepositoryResourceCard key={item.id} item={item} />
                  ) : (
                    <article
                      key={item.id}
                      className="group flex min-w-0 flex-col rounded-2xl border border-sky-950/10 bg-[linear-gradient(145deg,#ffffff_0%,#f4faff_100%)] p-3 transition hover:-translate-y-0.5 hover:border-sky-500/25 hover:shadow-lg sm:min-h-[300px] sm:p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 sm:h-10 sm:w-10">
                          <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {typeof item.stars === "number" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-black/60 ring-1 ring-black/5 sm:text-[10px]">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {formatNumber(item.stars)}
                            </span>
                          ) : item.isOfficial ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-semibold text-emerald-700 sm:text-[10px]">
                              Официальный
                            </span>
                          ) : null}
                          <FavoriteButton
                            toolId={item.id}
                            itemType="mcp"
                            iconOnly
                            callbackUrl={item.slug ? `/catalog/mcp/${item.slug}` : "/catalog?type=mcp"}
                            className="h-8 w-8"
                          />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-700/70 sm:text-[10px]">
                          {item.resourceType || "MCP Server"}
                        </div>
                        <div className="mt-1.5 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-semibold sm:text-base">
                            {item.slug ? (
                              <Link href={`/catalog/mcp/${item.slug}`} className="hover:underline">
                                {itemName(item)}
                              </Link>
                            ) : (
                              itemName(item)
                            )}
                          </h3>
                          {item.isOfficial && typeof item.stars === "number" && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                              Официальный
                            </span>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-black/55 sm:text-sm">
                          {item.descriptionRu || item.description || "Описание пока не добавлено."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {[item.languageName, item.categoryNames?.[0], item.location]
                            .filter((value): value is string => Boolean(value))
                            .slice(0, 3)
                            .map((value) => (
                              <span key={value} className="max-w-full truncate rounded-full bg-sky-100/70 px-2 py-1 text-[9px] text-sky-900/70 sm:text-[10px]">
                                {value}
                              </span>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                          <div className="flex min-w-0 items-center gap-2 text-[10px] text-black/45 sm:text-xs">
                            {typeof item.rating === "number" && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {item.rating.toFixed(1)}
                              </span>
                            )}
                            {item.author || item.authorName ? (
                              <span className="truncate">{item.author || item.authorName}</span>
                            ) : null}
                          </div>

                          {item.slug && (
                            <Link
                              href={`/catalog/mcp/${item.slug}`}
                              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-sky-700 px-2.5 text-[10px] font-semibold text-white transition hover:bg-sky-600 sm:px-3 sm:text-xs"
                            >
                              Подробнее
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  ),
                )}
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

      <div className="border-t border-black/10 bg-white">
        <Footer />
      </div>
    </div>
  );
}
