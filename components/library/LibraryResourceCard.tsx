import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { ToolImage } from "@/app/components/ToolImage";
import FavoriteButton from "@/components/FavoriteButton";

export type LibraryResourceType = "tools" | "mcp" | "prompts" | "skills" | "repos";

export type LibraryResourceItem = {
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

const ACCENT_CLASS_NAMES: Record<LibraryResourceType, string> = {
  tools: "bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 text-white shadow-orange-500/25",
  mcp: "bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-600 text-white shadow-sky-500/25",
  prompts: "bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700 text-white shadow-violet-500/25",
  skills: "bg-gradient-to-br from-emerald-300 via-teal-500 to-cyan-700 text-white shadow-teal-500/25",
  repos: "bg-gradient-to-br from-zinc-600 via-zinc-900 to-black text-white shadow-black/25",
};

export const LIBRARY_RESOURCE_PATHS: Record<LibraryResourceType, string> = {
  tools: "/catalog",
  mcp: "/catalog/mcp",
  prompts: "/catalog/prompts",
  skills: "/catalog/skills",
  repos: "/catalog/repos",
};

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

export function libraryItemTitle(item: LibraryResourceItem) {
  return item.titleRu || item.title || item.name || "Без названия";
}

function itemDescription(item: LibraryResourceItem, type: LibraryResourceType) {
  if (type === "mcp") return item.description || "Description is not available yet.";
  return item.descriptionRu || item.description || "Описание скоро появится.";
}

function itemMeta(item: LibraryResourceItem, type: LibraryResourceType) {
  if (type === "tools") {
    return typeof item.category === "object" ? item.category?.name : "AI-инструмент";
  }
  if (type === "mcp") return item.languageName || "MCP Server";
  if (type === "prompts") return item.sourceKind || "Готовый промпт";
  if (type === "skills") return typeof item.category === "string" ? item.category : "Навык агента";
  return item.language || "Open source";
}

export function libraryItemHref(item: LibraryResourceItem, type: LibraryResourceType) {
  if (type === "tools") return `/catalog/${item.id}`;
  if (type === "mcp" && item.slug) return `/catalog/mcp/${item.slug}`;
  if (type === "prompts") return `/catalog/prompts/${item.id}`;
  if (type === "skills") return `/catalog/skills/${item.id}`;
  if (type === "repos") return `/catalog/repos/${item.id}`;
  return LIBRARY_RESOURCE_PATHS[type];
}

function itemMetric(item: LibraryResourceItem) {
  if (typeof item.rating === "number" && item.rating > 0) return item.rating.toFixed(1);
  if (typeof item.stars === "number" && item.stars > 0) return formatNumber(item.stars);
  return null;
}

function initials(value: string) {
  const normalized = value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "AI").slice(0, 2).toUpperCase();
}

type LibraryResourceCardProps = {
  item: LibraryResourceItem;
  type: LibraryResourceType;
  href?: string;
  callbackUrl?: string;
  external?: boolean;
  onOpen?: () => void;
};

export function LibraryResourceCard({
  item,
  type,
  href = libraryItemHref(item, type),
  callbackUrl = LIBRARY_RESOURCE_PATHS[type],
  external = false,
  onOpen,
}: LibraryResourceCardProps) {
  const metric = itemMetric(item);
  const githubStars =
    (type === "mcp" || type === "skills" || type === "repos") &&
    typeof item.stars === "number" &&
    item.stars > 0
      ? formatNumber(item.stars)
      : null;
  const title = libraryItemTitle(item);
  const favoriteType = type === "tools" ? "aiTools" : type;

  const mainContent = type === "tools" ? (
    <>
      <ToolImage
        src={item.coverImage}
        alt={title}
        className="h-24 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-32"
        fallbackTextClassName="px-3 text-sm sm:text-lg"
      />
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-xs font-semibold leading-4 text-zinc-950 dark:text-white sm:text-sm sm:leading-5">
            {title}
          </h3>
          {metric ? (
            <span className="shrink-0 rounded-md bg-black px-1.5 py-0.5 text-[9px] font-semibold text-white dark:bg-white dark:text-black">
              {metric}
            </span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-black/55 dark:text-white/55 sm:text-xs sm:leading-5">
          {itemDescription(item, type)}
        </p>
        <div className="mt-auto truncate pt-3 text-[10px] text-black/45 dark:text-white/45 sm:text-xs">
          {itemMeta(item, type)}
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="flex min-w-0 items-start gap-2.5 pr-9 sm:gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-sm transition group-hover:scale-105 sm:h-12 sm:w-12 sm:text-sm ${ACCENT_CLASS_NAMES[type]}`}
        >
          {initials(title)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 pt-1 text-xs font-bold leading-4 text-zinc-950 dark:text-white sm:pt-1.5 sm:text-sm sm:leading-5">
            {title}
          </h3>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400 sm:text-xs sm:leading-5">
        {itemDescription(item, type)}
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <span className="max-w-[78%] truncate rounded-md border border-black/10 bg-black/[0.025] px-2 py-1 text-[9px] text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55 sm:text-[10px]">
          {itemMeta(item, type)}
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

  return (
    <article
      className={
        type === "tools"
          ? "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900 sm:min-h-[250px]"
          : "group relative flex min-h-[190px] min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-xl dark:border-white/10 dark:bg-black sm:min-h-[220px] sm:p-4"
      }
    >
      <FavoriteButton
        toolId={item.id}
        itemType={favoriteType}
        iconOnly
        callbackUrl={callbackUrl}
        className={type === "tools" ? "absolute right-2 top-2 z-20 h-8 w-8" : "absolute right-3 top-3 z-20 h-8 w-8"}
      />
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex min-h-0 flex-1 flex-col text-left">
          {mainContent}
        </button>
      ) : external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-0 flex-1 flex-col">
          {mainContent}
        </a>
      ) : (
        <Link href={href} className="flex min-h-0 flex-1 flex-col">
          {mainContent}
        </Link>
      )}
    </article>
  );
}
