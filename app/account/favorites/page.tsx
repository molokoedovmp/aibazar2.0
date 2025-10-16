import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppSidebar } from "@/components/app-sidebar";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  Compass,
  Heart,
  Layers,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

interface FavoriteTool {
  id: string;
  name: string;
  coverImage: string | null;
  rating: number | null;
  url: string | null;
  startPrice: number | null;
  categoryName: string | null;
  createdAt: Date;
}

function formatPrice(startPrice: number | null) {
  if (startPrice === null || startPrice === 0) return "Бесплатно";
  return `от $${startPrice.toFixed(startPrice % 1 === 0 ? 0 : 2)}`;
}

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${Math.max(minutes, 1)} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Вчера";
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес. назад`;
  const years = Math.floor(days / 365);
  return `${years} г. назад`;
}

function formatMonthDay(date: Date) {
  try {
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
  } catch {
    return date.toISOString().slice(5, 10);
  }
}

function isWithinDays(date: Date, days: number) {
  const diff = Date.now() - date.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export default async function FavoritesToolsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const favoritesRaw = await prisma.favorite.findMany({
    where: { userId: session.user.id, itemType: "aiTools" },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      aiTool: {
        select: {
          id: true,
          name: true,
          coverImage: true,
          rating: true,
          url: true,
          startPrice: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  const favoriteTools: FavoriteTool[] = favoritesRaw
    .map((item) => {
      if (!item.aiTool) return null;
      return {
        id: item.aiTool.id,
        name: item.aiTool.name,
        coverImage: item.aiTool.coverImage,
        rating: item.aiTool.rating ?? null,
        url: item.aiTool.url ?? null,
        startPrice: item.aiTool.startPrice ?? null,
        categoryName: item.aiTool.category?.name ?? null,
        createdAt: item.createdAt,
      } satisfies FavoriteTool;
    })
    .filter(Boolean) as FavoriteTool[];

  const totalFavorites = favoriteTools.length;
  const addedThisMonth = favoriteTools.filter((tool) => isWithinDays(tool.createdAt, 30)).length;
  const topRated = favoriteTools.filter((tool) => (tool.rating ?? 0) >= 4.5).length;
  const freeOrLowCost = favoriteTools.filter((tool) => !tool.startPrice || tool.startPrice <= 20).length;
  const averageRating = favoriteTools.length
    ? (favoriteTools.reduce((acc, tool) => acc + (tool.rating ?? 0), 0) / favoriteTools.length).toFixed(1)
    : "—";

  const categoryMap = new Map<string, number>();
  favoriteTools.forEach((tool) => {
    if (!tool.categoryName) return;
    categoryMap.set(tool.categoryName, (categoryMap.get(tool.categoryName) ?? 0) + 1);
  });

  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const recentFavorites = favoriteTools.slice(0, 6);

  const stats = [
    {
      label: "Всего избранных",
      value: totalFavorites,
      hint: "Ваш набор AI-ассистентов",
      icon: Heart,
    },
    {
      label: "Добавлено за 30 дней",
      value: addedThisMonth,
      hint: "Новые находки",
      icon: Sparkles,
    },
    {
      label: "Рейтинг 4.5+",
      value: topRated,
      hint: "Лучшие по отзывам",
      icon: Trophy,
    },
    {
      label: "Доступно до $20",
      value: freeOrLowCost,
      hint: "Демократы бюджета",
      icon: Layers,
    },
  ];

  const quickLinks = [
    {
      title: "Каталог AI-инструментов",
      description: "Сотни сервисов с фильтрами по задачам и бюджету.",
      href: "/catalog",
    },
    {
      title: "Рабочее пространство документов",
      description: "Конспекты, сценарии и публикации в едином редакторе.",
      href: "/account/documents",
    },
    {
      title: "Блог сообщества",
      description: "Опыт других авторов и идеи для внедрения AI.",
      href: "/blog",
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/70 px-4 backdrop-blur">
          <div className="flex flex-1 items-center gap-3">
            <SidebarTrigger className="text-slate-700 hover:bg-slate-100" />
            <Separator orientation="vertical" className="h-8 border-slate-200" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Избранные инструменты</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="hidden text-sm font-medium text-slate-500 md:block">
            Средний рейтинг любимых сервисов: <span className="text-slate-900">{averageRating}</span>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-10 px-6 py-10">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl">
              <div className="text-xs uppercase tracking-[0.35em] text-white/60">Favorites deck</div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                Подборка инструментов, которые работают на вас.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-white/75">
                Сохраняйте сервисы, которые помогли вам довести проекты до результата. Возвращайтесь к ним в один клик и расширяйте свой стек, открывая каталог.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/catalog"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-900 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:text-black"
                >
                  Найти новые инструменты
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/account/documents"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Работать с документами
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              {topCategories.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2">
                  {topCategories.map((category) => (
                    <span
                      key={category.name}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium text-white"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      {category.name}
                      <span className="text-white/60">• {category.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-900">Статистика подборки</div>
              <div className="mt-6 space-y-4">
                {stats.map(({ label, value, hint, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
                      <p className="text-xs text-slate-500">{hint}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Средний рейтинг сохранённых сервисов: <span className="font-semibold text-slate-900">{averageRating}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Недавно добавленные</h2>
              {totalFavorites > 0 && (
                <span className="text-sm text-slate-500">Последние {Math.min(recentFavorites.length, 6)} сервисов</span>
              )}
            </div>
            {recentFavorites.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                Здесь появятся инструменты, которые вы сохраните. Начните с каталога и отметьте понравившиеся решения.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentFavorites.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/catalog/${tool.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    {tool.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tool.coverImage}
                        alt={tool.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-slate-400">
                        <Compass className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{formatMonthDay(tool.createdAt)}</span>
                          <span>•</span>
                          <span>{formatRelative(tool.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">
                          {tool.name}
                        </h3>
                        {tool.categoryName && (
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            <Layers className="h-3.5 w-3.5" />
                            {tool.categoryName}
                          </div>
                        )}
                      </div>
                      <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
                        <span>
                          {tool.rating ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                              <Star className="h-4 w-4 fill-current" />
                              {tool.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Нет рейтинга</span>
                          )}
                        </span>
                        <span className="font-medium text-slate-700">{formatPrice(tool.startPrice)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {topCategories.length > 0 && (
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Категории интересов</h2>
                <span className="text-sm text-slate-500">На основании сохранённых инструментов</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {topCategories.map((category) => (
                  <span
                    key={category.name}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    <Layers className="h-4 w-4" />
                    {category.name}
                    <span className="text-slate-500">{category.count}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Что попробовать дальше</h2>
              <p className="mt-2 text-sm text-slate-500">
                Попробуйте расширить набор любимых инструментов: сохраняйте новые сервисы, сравнивайте тарифы и делитесь подборками с коллегами.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{link.title}</div>
                      <p className="mt-2 text-xs text-slate-500">{link.description}</p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-700 group-hover:text-slate-900">
                      Перейти
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-500 shadow-inner">
              <div className="text-sm font-semibold text-slate-700">Подсказки по сборке фаворитов</div>
              <ul className="mt-3 space-y-3">
                <li>Добавляйте разные категории сервисов, чтобы быстрее находить решения под задачу.</li>
                <li>Фиксируйте бесплатные тарифы — они пригодятся в пилотных проектах.</li>
                <li>Возвращайтесь к избранному после тестов и отметьте, что сработало лучше всего.</li>
              </ul>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
