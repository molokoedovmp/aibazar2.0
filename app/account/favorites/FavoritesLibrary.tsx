"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Boxes,
  BrainCircuit,
  Check,
  Copy,
  ExternalLink,
  Github,
  Search,
  Star,
  WandSparkles,
} from "lucide-react";

import { ToolImage } from "@/app/components/ToolImage";
import FavoriteButton from "@/components/FavoriteButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type FavoriteItemType = "aiTools" | "mcp" | "prompts" | "skills" | "repos";

export type FavoriteResource = {
  id: string;
  itemType: FavoriteItemType;
  name: string;
  description: string;
  coverImage: string | null;
  meta: string;
  rating: number | null;
  stars: number | null;
  href: string;
  createdAt: string;
  content: string | null;
  externalUrl: string | null;
  installCommand: string | null;
  tags: string[];
  author: string | null;
  language: string | null;
};

const typeConfig = {
  aiTools: {
    label: "AI-инструменты",
    singular: "AI-инструмент",
    icon: Boxes,
    accent: "bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 text-white shadow-orange-500/25",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    catalogHref: "/catalog?type=tools",
  },
  mcp: {
    label: "MCP-серверы",
    singular: "MCP",
    icon: BrainCircuit,
    accent: "bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-600 text-white shadow-sky-500/25",
    badge: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    catalogHref: "/catalog/mcp",
  },
  prompts: {
    label: "Промпты",
    singular: "Промпт",
    icon: BookOpenText,
    accent: "bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700 text-white shadow-violet-500/25",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    catalogHref: "/catalog/prompts",
  },
  skills: {
    label: "Навыки",
    singular: "Навык",
    icon: WandSparkles,
    accent: "bg-gradient-to-br from-emerald-300 via-teal-500 to-cyan-700 text-white shadow-teal-500/25",
    badge: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
    catalogHref: "/catalog/skills",
  },
  repos: {
    label: "Репозитории",
    singular: "Репозиторий",
    icon: Github,
    accent: "bg-gradient-to-br from-zinc-600 via-zinc-900 to-black text-white shadow-black/25",
    badge: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
    catalogHref: "/catalog/repos",
  },
} satisfies Record<
  FavoriteItemType,
  {
    label: string;
    singular: string;
    icon: typeof Boxes;
    accent: string;
    badge: string;
    catalogHref: string;
  }
>;

const typeOrder = Object.keys(typeConfig) as FavoriteItemType[];

function initials(value: string) {
  const normalized = value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "AI").slice(0, 2).toUpperCase();
}

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

function CopyButton({ value, label = "Копировать" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-semibold text-white transition hover:bg-black/80"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Скопировано" : label}
    </button>
  );
}

function ResourceDetailsDialog({ resource, children }: { resource: FavoriteResource; children: ReactNode }) {
  const isPrompt = resource.itemType === "prompts";
  const isSkill = resource.itemType === "skills";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-hidden rounded-2xl border-black/10 p-0">
        <DialogHeader className="border-b border-black/10 px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${typeConfig[resource.itemType].badge}`}>
              {typeConfig[resource.itemType].singular}
            </span>
            {resource.stars !== null && (
              <span className="inline-flex items-center gap-1 text-xs text-black/45">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {formatNumber(resource.stars)}
              </span>
            )}
          </div>
          <DialogTitle className="pt-2 text-xl font-bold leading-tight text-black sm:text-2xl">
            {resource.name}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-black/50">
            {resource.description}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-black/[0.035] p-3 text-xs sm:grid-cols-3">
            <div>
              <span className="block text-black/35">Категория</span>
              <strong className="mt-1 block truncate text-black">{resource.meta}</strong>
            </div>
            {resource.author && (
              <div>
                <span className="block text-black/35">Автор</span>
                <strong className="mt-1 block truncate text-black">{resource.author}</strong>
              </div>
            )}
            {resource.language && (
              <div>
                <span className="block text-black/35">Язык</span>
                <strong className="mt-1 block truncate text-black">{resource.language}</strong>
              </div>
            )}
          </div>

          {resource.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] text-black/50">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {isPrompt && resource.content && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-black">Текст промпта</h3>
                <CopyButton value={resource.content} />
              </div>
              <pre className="max-h-[42vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-black/10 bg-black/[0.035] p-4 font-mono text-xs leading-6 text-black/70">
                {resource.content}
              </pre>
            </div>
          )}

          {isSkill && resource.installCommand && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-black">Команда установки</h3>
                <CopyButton value={resource.installCommand} label="Копировать команду" />
              </div>
              <pre className="overflow-x-auto rounded-xl bg-black p-4 font-mono text-xs leading-5 text-white/80">
                {resource.installCommand}
              </pre>
            </div>
          )}

          {resource.externalUrl && (
            <a
              href={resource.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 px-4 text-xs font-semibold text-black transition hover:bg-black/5"
            >
              {resource.itemType === "repos" ? "Открыть GitHub" : "Открыть источник"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CardContent({ resource }: { resource: FavoriteResource }) {
  const config = typeConfig[resource.itemType];
  const githubStars =
    (resource.itemType === "mcp" || resource.itemType === "skills" || resource.itemType === "repos") &&
    resource.stars
      ? formatNumber(resource.stars)
      : null;

  return (
    <>
      <div className="flex min-w-0 items-start gap-2.5 pr-9 sm:gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition group-hover:scale-105 sm:h-12 sm:w-12 sm:text-sm ${config.accent}`}>
          {initials(resource.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 pt-1 text-xs font-bold leading-4 text-zinc-950 dark:text-white sm:pt-1.5 sm:text-sm sm:leading-5">
            {resource.name}
          </h3>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400 sm:text-xs sm:leading-5">
        {resource.description}
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <span className="max-w-[78%] truncate rounded-md border border-black/10 bg-black/[0.025] px-2 py-1 text-[9px] text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55 sm:text-[10px]">
          {resource.meta}
        </span>
        <span className="inline-flex shrink-0 items-center gap-2">
          {githubStars ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-black/45 dark:text-white/45 sm:text-[10px]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {githubStars}
            </span>
          ) : null}
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-black/30 transition group-hover:translate-x-1 group-hover:text-black dark:text-white/30 dark:group-hover:text-white" />
        </span>
      </div>
    </>
  );
}

function ResourceCard({ resource }: { resource: FavoriteResource }) {
  const hasDedicatedPage = resource.itemType === "aiTools" || resource.itemType === "mcp";
  const contentClassName = "flex min-h-0 flex-1 flex-col text-left";

  if (resource.itemType === "aiTools") {
    return (
      <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900 sm:min-h-[250px]">
        <FavoriteButton
          toolId={resource.id}
          itemType="aiTools"
          isFavoritedInitial
          iconOnly
          callbackUrl="/account/favorites"
          className="absolute right-2 top-2 z-20 h-8 w-8"
        />
        <Link href={resource.href} className="flex min-h-0 flex-1 flex-col">
          <ToolImage
            src={resource.coverImage}
            alt={resource.name}
            className="h-24 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-32"
            fallbackTextClassName="px-3 text-sm sm:text-lg"
          />
          <div className="flex flex-1 flex-col p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-xs font-semibold leading-4 text-zinc-950 dark:text-white sm:text-sm sm:leading-5">
                {resource.name}
              </h3>
              {resource.rating ? (
                <span className="shrink-0 rounded-md bg-black px-1.5 py-0.5 text-[9px] font-semibold text-white dark:bg-white dark:text-black">
                  {resource.rating.toFixed(1)}
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-black/55 dark:text-white/55 sm:text-xs sm:leading-5">
              {resource.description}
            </p>
            <div className="mt-auto truncate pt-3 text-[10px] text-black/45 dark:text-white/45 sm:text-xs">
              {resource.meta}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group relative flex min-h-[190px] min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-xl dark:border-white/10 dark:bg-black sm:min-h-[220px] sm:p-4">
      <FavoriteButton
        toolId={resource.id}
        itemType={resource.itemType}
        isFavoritedInitial
        iconOnly
        callbackUrl="/account/favorites"
        className="absolute right-3 top-3 z-20 h-8 w-8"
      />

      {hasDedicatedPage ? (
        <Link href={resource.href} className={contentClassName}>
          <CardContent resource={resource} />
        </Link>
      ) : (
        <ResourceDetailsDialog resource={resource}>
          <button type="button" className={contentClassName}>
            <CardContent resource={resource} />
          </button>
        </ResourceDetailsDialog>
      )}
    </article>
  );
}

export function FavoritesLibrary({ resources }: { resources: FavoriteResource[] }) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<"all" | FavoriteItemType>("all");

  const counts = useMemo(
    () => Object.fromEntries(
      typeOrder.map((type) => [type, resources.filter((item) => item.itemType === type).length]),
    ) as Record<FavoriteItemType, number>,
    [resources],
  );

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    return resources.filter((resource) => {
      if (activeType !== "all" && resource.itemType !== activeType) return false;
      if (!normalizedQuery) return true;

      return [resource.name, resource.description, resource.meta, resource.author, ...resource.tags]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ru-RU")
        .includes(normalizedQuery);
    });
  }, [activeType, query, resources]);

  const visibleTypes = typeOrder.filter((type) =>
    filteredResources.some((resource) => resource.itemType === type),
  );

  return (
    <>
      <div className="mb-7 rounded-2xl border border-black/10 bg-white p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск в избранном..."
            className="h-11 w-full rounded-xl border border-black/10 bg-[#f7f7f5] pl-10 pr-4 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black/30 focus:bg-white"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveType("all")}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${activeType === "all" ? "bg-black text-white" : "bg-black/5 text-black/60 hover:bg-black/10"}`}
          >
            Все <span className="ml-1 opacity-60">{resources.length}</span>
          </button>
          {typeOrder.map((type) => {
            const config = typeConfig[type];
            const count = counts[type];
            if (!count) return null;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${activeType === type ? "bg-black text-white" : "bg-black/5 text-black/60 hover:bg-black/10"}`}
              >
                {config.label} <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleTypes.length ? (
        <div className="space-y-9">
          {visibleTypes.map((type) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            const items = filteredResources.filter((resource) => resource.itemType === type);

            return (
              <section key={type}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.accent}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="truncate text-base font-bold text-black sm:text-lg">{config.label}</h2>
                    <span className="text-xs text-black/35">{items.length}</span>
                  </div>
                  <Link href={config.catalogHref} className="shrink-0 text-xs font-semibold text-black/50 transition hover:text-black">
                    Открыть раздел
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {items.map((resource) => (
                    <ResourceCard key={`${resource.itemType}:${resource.id}`} resource={resource} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white px-5 py-12 text-center">
          <p className="text-sm font-semibold text-black">Ничего не найдено</p>
          <p className="mt-1 text-sm text-black/45">Попробуйте изменить запрос или выбрать другой раздел.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveType("all");
            }}
            className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </>
  );
}
