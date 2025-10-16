"use client";

import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search as SearchIcon, FileText, Info, Compass } from "lucide-react";

/* ---------- Типы ---------- */
interface AiTool {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  url?: string;
  // type скрыт в карточке
  rating?: number;
  price?: number;
  startPrice?: number;
  createdAt?: string;
  category: { id: string; name: string; icon?: string };
}
interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string | null;
  aiTools: Omit<AiTool, "category">[];
}

/* ---------- Иконка категории (emoji / data: / http) ---------- */
function CategoryIcon({
  src,
  className = "",
  size = 16,
  title,
}: {
  src?: string;
  className?: string;
  size?: number;
  title?: string;
}) {
  if (!src) return null;
  if (/^(data:image\/|https?:\/\/)/i.test(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={title || ""}
        width={size}
        height={size}
        className={`inline-block object-contain ${className}`}
        draggable={false}
      />
    );
  }
  return (
    <span
      className={`inline-block leading-none select-none ${className}`}
      style={{ fontSize: size }}
      title={title}
    >
      {src}
    </span>
  );
}

/* ---------- Панель секции ---------- */
function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/10 ${className}`}>
      <div className="mb-4 flex items-end justify-between">
        <h3 className="text-[12px] sm:text-[13px] uppercase tracking-[0.35em] text-slate-700">{title}</h3>
        {subtitle ? <span className="text-xs text-gray-500">{subtitle}</span> : null}
      </div>
      {children}
    </section>
  );
}

// ---------- SKELETONS ----------
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/10">
      <div className="h-40 w-full animate-pulse bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
        <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
        <div className="h-3 w-2/3 bg-gray-200 animate-pulse rounded" />
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ---------- Сетка карточек ---------- */
function ToolsGrid({ tools }: { tools: AiTool[] }) {
  if (!tools?.length) {
    return <p className="mt-2 text-sm text-gray-500">Нет инструментов для отображения.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <Link
          key={tool.id}
          href={`/catalog/${tool.id}`}
          className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 transition-transform hover:-translate-y-0.5 hover:shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {tool.coverImage ? (
            <img src={tool.coverImage} alt={tool.name} className="h-40 w-full object-cover" />
          ) : (
            <div className="flex h-40 w-full items-center justify-center bg-gray-100 text-gray-500">
              Без изображения
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="line-clamp-2 text-base font-semibold text-black tracking-tight">
                {tool.name}
              </h4>
              {typeof tool.rating === "number" && (
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-semibold">
                  {tool.rating.toFixed(1)}
                </span>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{tool.description}</p>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <CategoryIcon src={tool.category.icon} size={16} title={tool.category.name} />
              <span className="truncate">{tool.category.name}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Страница ---------- */
export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const allPanelRef = useRef<HTMLDivElement | null>(null);

  /* загрузка категорий */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        const arr: Category[] = json?.success ? json.data : json;
        setCategories(Array.isArray(arr) ? arr : []);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* плоский список инструментов */
  const allTools: AiTool[] = useMemo(
    () =>
      categories.flatMap((c) =>
        (c.aiTools ?? []).map((t) => ({
          ...t,
          category: { id: c.id, name: c.name, icon: c.icon },
        }))
      ),
    [categories]
  );

  // Источник — фильтрация по категории и поисковой строке
  const baseFiltered = useMemo(() => {
    let arr = [...allTools];
    if (activeCategory !== "all") arr = arr.filter((t) => t.category.id === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.name.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [allTools, activeCategory, query]);

  // Популярные и список всех — сортируем по рейтингу
  const popularTools = useMemo(
    () => [...baseFiltered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 12),
    [baseFiltered]
  );

  const filteredAll = useMemo(
    () => [...baseFiltered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [baseFiltered]
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <div className="grid w-full grid-cols-1 md:grid-cols-[260px_1px_minmax(0,1fr)]">
        {/* ---------- Сайдбар (липкий) ---------- */}
        <aside className="hidden md:block sticky top-0 h-screen overflow-y-auto bg-white">
          <nav className="py-3">
            {/* Обзор (без иконки) */}
            <SideNavLink label="Обзор" href="/catalog" icon={<Compass className="h-4 w-4" />} />

            {/* Статьи / О нас */}
            <SideNavLink label="Статьи" href="/blog" icon={<FileText className="h-4 w-4" />} />
            <SideNavLink label="О нас" href="/about" icon={<Info className="h-4 w-4" />} />

            <Separator className="my-3 bg-gray-200" />

            {/* Все инструменты (без иконки) */}
            <SideCategory
              label="Все инструменты"
              active={activeCategory === "all"}
              onClick={() => {
                setActiveCategory("all");
                setTimeout(() => allPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
              }}
            />

            {loading ? (
              <div className="px-4 py-1 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 w-full animate-pulse rounded bg-gray-200" />
                ))}
              </div>
            ) : (
              categories.map((c) => (
                <SideCategory
                  key={c.id}
                  label={c.name}
                  icon={c.icon}
                  active={activeCategory === c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    setTimeout(() => allPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                  }}
                />
              ))
            )}
          </nav>
        </aside>

        {/* Вертикальный разделитель */}
        <Separator orientation="vertical" className="hidden md:block sticky top-0 h-screen bg-gray-200" />

        {/* ---------- Контент ---------- */}
        <main className="min-w-0 px-4 py-6 md:px-6">
          {/* HERO */}
          <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/10">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cathero.png"
                alt="Все инструменты в одном месте"
                className="h-[260px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/70" />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-[28px] font-bold leading-tight sm:text-[40px] text-black tracking-tight">
                  Все инструменты, которые вам нужны
                  <br />— в одном месте.
                </h1>
                <p className="mt-2 max-w-2xl text-gray-700">
                  Инструменты, ресурсы и продукты. Обновляем каждую неделю.
                </p>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="mt-4 flex w-full max-w-md items-center gap-3 rounded-full border border-gray-300 bg-white/90 p-2 backdrop-blur"
                >
                  <Input
                    type="email"
                    placeholder="Email"
                    className="h-11 w-full rounded-full border-0 bg-transparent text-black placeholder:text-gray-500 focus-visible:ring-0"
                  />
                  <Button className="h-11 rounded-full bg-black text-white hover:bg-black/90">
                    Подписаться
                  </Button>
                </form>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 w-6 rounded-full border border-gray-300 bg-gray-200" />
                    ))}
                  </div>
                  Доверяют более 5000+ создателей
                </div>
              </div>
            </div>
          </section>

          {/* Поиск/фильтры */}
          <div className="sticky top-0 z-30 mt-4">
            <div className="flex flex-col gap-3 rounded-xl bg-white/90 p-3 backdrop-blur md:flex-row md:items-center ring-1 ring-black/10">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск инструментов и категорий…"
                  className="h-11 w-full rounded-lg bg-transparent pl-9 text-black placeholder:text-gray-500 focus-visible:ring-0 border-gray-300"
                />
              </div>

              <div className="flex items-center gap-2 md:justify-end">
                <select
                  value={activeCategory}
                  onChange={(e) => {
                    setActiveCategory(e.target.value);
                    // Скролл к панели "Все инструменты"
                    setTimeout(() => allPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                  }}
                  className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none hover:bg-gray-50 text-black"
                  aria-label="Категория"
                >
                  <option value="all">Все категории</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Секции */}
          <Panel title="Избранные инструменты" subtitle="Самые популярные сейчас">
            {loading ? <SkeletonGrid count={8} /> : <ToolsGrid tools={popularTools} />}
          </Panel>

          <div ref={allPanelRef} />
          <Panel
            title={activeCategory === "all" ? "Все инструменты" : `Категория: ${categories.find(c => c.id === activeCategory)?.name ?? ""}`}
          >
            {loading ? <SkeletonGrid count={12} /> : <ToolsGrid tools={filteredAll} />}
          </Panel>
        </main>
      </div>

      <Footer />
    </div>
  );
}

/* ---------- Сайдбар: ссылки и категории (нужное поведение hover) ---------- */
function SideNavLink({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative block px-4 py-2 text-sm text-gray-700 transition-colors",
        "hover:text-black hover:bg-black/[0.06]",
        // толстая чёрная полоса слева только при hover
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-transparent hover:before:bg-black",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        {icon ? <span className="text-gray-600">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </span>
    </Link>
  );
}

function SideCategory({
  label,
  onClick,
  icon,
  active,
}: {
  label: string;
  onClick?: () => void;
  icon?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors",
        active ? "text-black bg-black/[0.06]" : "text-gray-700 hover:text-black hover:bg-black/[0.06]",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px]",
        active ? "before:bg-black" : "before:bg-transparent hover:before:bg-black",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-center gap-2">
        <CategoryIcon src={icon} size={16} title={label} />
        <span className="truncate">{label}</span>
      </span>
    </button>
  );
}
