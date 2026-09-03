"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  Github,
  LoaderCircle,
  Search,
  Sparkles,
  Star,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { ToolImage } from "@/app/components/ToolImage";
import FavoriteButton from "@/components/FavoriteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CommunityFeedItem,
  CommunityFeedResponse,
  CommunityFeedType,
  CommunityResourceType,
} from "@/lib/community-types";
import { cn } from "@/lib/utils";

type FeedConfig = {
  label: string;
  plural: string;
  action: string;
  icon: LucideIcon;
  iconClass: string;
};

const configs: Record<CommunityResourceType, FeedConfig> = {
  articles: { label: "Статья", plural: "Статьи", action: "Читать", icon: FileText, iconClass: "bg-zinc-950 text-white dark:bg-white dark:text-black" },
  tools: { label: "AI-инструмент", plural: "AI-инструменты", action: "Открыть карточку", icon: Boxes, iconClass: "bg-orange-500 text-white" },
  mcp: { label: "MCP-сервер", plural: "MCP", action: "Открыть карточку", icon: BrainCircuit, iconClass: "bg-sky-500 text-white" },
  prompts: { label: "Промпт", plural: "Промпты", action: "Посмотреть промпт", icon: BookOpenText, iconClass: "bg-violet-500 text-white" },
  skills: { label: "Навык", plural: "Навыки", action: "Посмотреть навык", icon: WandSparkles, iconClass: "bg-teal-500 text-white" },
  repos: { label: "Репозиторий", plural: "Репозитории", action: "Подробнее", icon: Github, iconClass: "bg-zinc-950 text-white dark:bg-white dark:text-black" },
};

const filters: Array<{ value: CommunityFeedType; label: string }> = [
  { value: "all", label: "Вся лента" },
  { value: "articles", label: "Статьи" },
  { value: "tools", label: "AI-инструменты" },
  { value: "mcp", label: "MCP" },
  { value: "prompts", label: "Промпты" },
  { value: "skills", label: "Навыки" },
  { value: "repos", label: "Репозитории" },
];

const favoriteTypes = {
  tools: "aiTools",
  mcp: "mcp",
  prompts: "prompts",
  skills: "skills",
  repos: "repos",
} as const;

function formatMetric(value: number) {
  return new Intl.NumberFormat("ru-RU", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function relativeDate(value: string) {
  const date = new Date(value);
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return "Сегодня";
  if (days === 1) return "Вчера";
  if (days < 7) return `${days} дн. назад`;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" }).format(date);
}

function FeedIcon({ type, className }: { type: CommunityResourceType; className?: string }) {
  const config = configs[type];
  const Icon = config.icon;
  return (
    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm", config.iconClass, className)}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

function FeedCard({ item }: { item: CommunityFeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const touchStart = useRef<number | null>(null);
  const config = configs[item.type];
  const favoriteType = item.type === "articles" ? null : favoriteTypes[item.type];
  const inlineDetails = item.type === "prompts" || item.type === "skills" || item.type === "repos";
  const hasVisual = item.type === "articles" || item.type === "tools" || item.coverImages.length > 0;
  const images = item.coverImages.length ? item.coverImages : [item.coverImage].filter((value): value is string => Boolean(value));

  async function copyContent() {
    if (!item.detailContent) return;
    await navigator.clipboard.writeText(item.detailContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-900 dark:shadow-none dark:hover:border-white/20">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <FeedIcon type={item.type} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{config.label}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{relativeDate(item.createdAt)}</span>
              {item.isOfficial ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Официальный</span> : null}
            </div>
            {item.author ? <p className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500">{item.author}</p> : null}
          </div>
          {favoriteType ? (
            <FavoriteButton toolId={item.id} itemType={favoriteType} iconOnly callbackUrl="/blog" className="h-10 w-10 dark:bg-zinc-950" />
          ) : null}
        </div>

        {inlineDetails ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="group mt-5 block w-full text-left">
            <h2 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-zinc-950 group-hover:underline dark:text-white sm:text-2xl">{item.title}</h2>
            <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-zinc-600 dark:text-zinc-300">{item.description}</p>
          </button>
        ) : (
          <Link href={item.href} className="group mt-5 block">
            <h2 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-zinc-950 group-hover:underline dark:text-white sm:text-2xl">{item.title}</h2>
            <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-zinc-600 dark:text-zinc-300">{item.description}</p>
          </Link>
        )}
      </div>

      {hasVisual ? (
        <div
          className="relative mx-5 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 sm:mx-6"
          onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStart.current === null || images.length < 2) return;
            const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
            if (Math.abs(distance) > 40) setActiveImage((index) => distance < 0 ? (index + 1) % images.length : (index - 1 + images.length) % images.length);
            touchStart.current = null;
          }}
        >
          <ToolImage src={images[activeImage]} alt={`${item.title}${images.length > 1 ? ` — ${activeImage + 1}` : ""}`} className="h-52 w-full object-cover transition duration-300 sm:h-72" fallbackTextClassName="text-2xl sm:text-3xl" />
          {images.length > 1 ? <>
            <button type="button" aria-label="Предыдущее изображение" onClick={() => setActiveImage((index) => (index - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur transition hover:bg-black/85"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" aria-label="Следующее изображение" onClick={() => setActiveImage((index) => (index + 1) % images.length)} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur transition hover:bg-black/85"><ChevronRight className="h-5 w-5" /></button>
            <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">{activeImage + 1} / {images.length}</span>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2.5 py-2 backdrop-blur">{images.map((_, index) => <button key={index} type="button" aria-label={`Показать изображение ${index + 1}`} onClick={() => setActiveImage(index)} className={cn("h-1.5 rounded-full transition-all", activeImage === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80")} />)}</div>
          </> : null}
        </div>
      ) : null}

      {inlineDetails && expanded ? (
        <div className="mx-5 mt-5 rounded-2xl border border-black/8 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-950 sm:mx-6 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{item.type === "prompts" ? "Текст промпта" : item.type === "skills" ? "Описание навыка" : "О репозитории"}</p>
            {item.type === "prompts" && item.detailContent ? <button type="button" onClick={() => void copyContent()} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium dark:border-white/10 dark:bg-zinc-900">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Скопировано" : "Копировать"}</button> : null}
          </div>
          <div className="mt-4 max-h-[28rem] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700 dark:text-zinc-200">{item.detailContent || item.description}</div>
          {item.type === "skills" && item.installCommand ? <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Установка</p><pre className="mt-2 overflow-x-auto rounded-xl bg-black p-4 text-xs leading-5 text-white"><code>{item.installCommand}</code></pre></div> : null}
          {item.type === "repos" && item.externalUrl ? <a href={item.externalUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">Открыть на GitHub <ExternalLink className="h-4 w-4" /></a> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 px-5 pt-5 sm:px-6">
        {[item.category, ...item.tags].filter((tag, index, values): tag is string => Boolean(tag) && values.indexOf(tag) === index).slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] text-zinc-600 dark:bg-white/7 dark:text-zinc-300">{tag}</span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/7 px-5 py-4 dark:border-white/8 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          {typeof item.rating === "number" && item.rating > 0 ? <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{item.rating.toFixed(1)}</span> : null}
          {typeof item.stars === "number" && item.stars > 0 ? <span className="flex items-center gap-1"><Github className="h-3.5 w-3.5" />{formatMetric(item.stars)}</span> : null}
          {typeof item.views === "number" ? <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatMetric(item.views)}</span> : null}
          {typeof item.readTime === "number" && item.readTime > 0 ? <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{item.readTime} мин</span> : null}
        </div>
        {inlineDetails ? <button type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-zinc-950 dark:text-white"><span>{expanded ? "Свернуть" : config.action}</span><ChevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} /></button> : <Link href={item.href} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-zinc-950 hover:gap-2.5 dark:text-white"><span className="hidden sm:inline">{config.action}</span><ArrowRight className="h-4 w-4" /></Link>}
      </div>
    </article>
  );
}

export function CommunityFeed({
  initialData,
  initialType,
  initialQuery,
}: {
  initialData: CommunityFeedResponse;
  initialType: CommunityFeedType;
  initialQuery: string;
}) {
  const [activeType, setActiveType] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState(initialData.data);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const firstRequest = useRef(true);
  const totalResources = useMemo(() => Object.values(initialData.counts).reduce((sum, count) => sum + count, 0), [initialData.counts]);

  useEffect(() => {
    if (firstRequest.current) {
      firstRequest.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ type: activeType, page: "1", limit: "12" });
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch(`/api/community/feed?${params}`, { signal: controller.signal });
        const payload = await response.json() as CommunityFeedResponse | { error?: string };
        if (!response.ok || !("success" in payload)) throw new Error("error" in payload ? payload.error || "Не удалось загрузить ленту" : "Не удалось загрузить ленту");
        setItems(payload.data);
        setPagination(payload.pagination);
        const url = new URL(window.location.href);
        if (activeType === "all") url.searchParams.delete("type");
        else url.searchParams.set("type", activeType);
        if (query.trim()) url.searchParams.set("q", query.trim());
        else url.searchParams.delete("q");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") setError("Не удалось обновить ленту. Попробуйте ещё раз.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query === initialQuery ? 0 : 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeType, initialQuery, query]);

  async function loadMore() {
    setLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({ type: activeType, page: String(pagination.page + 1), limit: "12" });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/community/feed?${params}`);
      const payload = await response.json() as CommunityFeedResponse | { error?: string };
      if (!response.ok || !("success" in payload)) throw new Error("Не удалось загрузить продолжение");
      setItems((current) => {
        const existing = new Set(current.map((item) => `${item.type}:${item.id}`));
        return [...current, ...payload.data.filter((item) => !existing.has(`${item.type}:${item.id}`))];
      });
      setPagination(payload.pagination);
    } catch {
      setError("Не удалось загрузить продолжение ленты.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-black text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(139,92,246,0.23),transparent_30%),radial-gradient(circle_at_70%_100%,rgba(16,185,129,0.16),transparent_28%)]" />
          <div className="relative mx-auto max-w-[1160px] px-4 py-14 sm:px-6 sm:py-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/7 px-3 py-1.5 text-xs font-medium text-white/80"><Sparkles className="h-3.5 w-3.5" />Лента AI Bazar</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Всё новое в мире AI</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">Статьи, AI-инструменты, MCP-серверы, промпты, навыки и open-source проекты — в одной живой ленте.</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/55">
              <span><strong className="mr-1.5 text-white">{formatMetric(totalResources)}</strong>материалов</span>
              <span><strong className="mr-1.5 text-white">{formatMetric(initialData.counts.articles)}</strong>статей</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Обновляется вместе с каталогом</span>
            </div>
          </div>
        </section>

        <div className="sticky top-0 z-30 border-b border-black/8 bg-[#f6f6f3]/95 backdrop-blur dark:border-white/10 dark:bg-zinc-950/95 md:top-0">
          <div className="mx-auto flex max-w-[1160px] gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6">
            {filters.map((filter) => {
              const count = filter.value === "all" ? totalResources : initialData.counts[filter.value];
              return <button key={filter.value} type="button" onClick={() => setActiveType(filter.value)} className={cn("flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition", activeType === filter.value ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/10 bg-white hover:border-black/25 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/25")}><span>{filter.label}</span><span className={cn("text-[11px]", activeType === filter.value ? "opacity-65" : "text-zinc-400")}>{formatMetric(count)}</span></button>;
            })}
          </div>
        </div>

        <div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,760px)_280px] lg:items-start lg:py-12">
          <section>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по ленте..." className="h-12 rounded-2xl border-black/10 bg-white pl-11 shadow-none dark:border-white/10 dark:bg-zinc-900" />
            </div>

            <div className="mt-6 space-y-5">
              {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[26px] border border-black/8 bg-white dark:border-white/10 dark:bg-zinc-900" />) : items.map((item) => <FeedCard key={`${item.type}:${item.id}`} item={item} />)}
            </div>

            {!loading && items.length === 0 ? <div className="mt-6 rounded-[26px] border border-dashed border-black/15 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-zinc-900"><p className="text-lg font-semibold">Ничего не найдено</p><p className="mt-2 text-sm text-zinc-500">Измените запрос или выберите другую категорию.</p></div> : null}
            {error ? <p className="mt-5 text-center text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            {!loading && pagination.hasMore ? <div className="mt-7 flex justify-center"><Button type="button" onClick={loadMore} disabled={loadingMore} variant="outline" className="h-11 rounded-full border-black/15 bg-white px-6 dark:border-white/15 dark:bg-zinc-900">{loadingMore ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}Показать ещё</Button></div> : null}
          </section>

          <aside className="hidden space-y-5 lg:sticky lg:top-20 lg:block">
            <div className="rounded-[26px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
              <h2 className="font-semibold">Разделы сообщества</h2>
              <div className="mt-4 space-y-1">
                {filters.slice(1).map((filter) => {
                  const type = filter.value as CommunityResourceType;
                  const Icon = configs[type].icon;
                  return <button key={type} type="button" onClick={() => setActiveType(type)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-white/7", activeType === type && "bg-zinc-100 font-medium dark:bg-white/7")}><Icon className="h-4 w-4" /><span className="flex-1">{configs[type].plural}</span><span className="text-xs text-zinc-400">{formatMetric(initialData.counts[type])}</span></button>;
                })}
              </div>
            </div>
            <div className="overflow-hidden rounded-[26px] bg-black p-6 text-white">
              <Sparkles className="h-6 w-6 text-sky-400" />
              <h2 className="mt-5 text-xl font-semibold">Есть чем поделиться?</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">Создайте полезную статью — после публикации она появится в общей ленте.</p>
              <Link href="/account/documents" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Создать статью <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
