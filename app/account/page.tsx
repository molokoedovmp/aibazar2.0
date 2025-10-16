import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import CreateDocumentButton from "@/components/account/CreateDocumentButton";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ArrowUpRight,
  Bot,
  FileText,
  Heart,
  PenLine,
  Sparkles,
} from "lucide-react";

interface RecentDocument {
  id: string;
  title: string;
  preview: string;
  updatedAt: Date;
  isPublished: boolean;
  isFavorite: boolean;
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function shortenPreview(text: string, maxWords = 40) {
  const normalized = normalizeWhitespace(String(text ?? ""));
  if (!normalized) return "";
  const words = normalized.split(" ");
  if (words.length <= maxWords) return normalized;
  return words.slice(0, maxWords).join(" ") + "…";
}

function extractPreviewText(content?: string | null, fallback?: string | null) {
  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const paragraphs = parsed
          .filter((block: any) => block?.type === "paragraph")
          .map((block: any) => {
            if (typeof block?.props?.text === "string") return block.props.text;
            const richText = block?.content
              ?.map((n: any) => (typeof n?.text === "string" ? n.text : ""))
              .filter(Boolean)
              .join(" ");
            return typeof richText === "string" ? richText : "";
          })
          .filter((text: string) => text.trim().length > 0);
        if (paragraphs.length > 0) {
          return shortenPreview(paragraphs.join(" "));
        }
      }
    } catch {
      return shortenPreview(content);
    }
  }

  if (fallback) {
    return shortenPreview(fallback);
  }

  return "";
}

function formatDateLabel(date: Date) {
  try {
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatTimeLabel(date: Date) {
  try {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

export default async function AccountHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  const userName = session.user.name ?? "";

  const [totalDocuments, publishedDocuments, favoriteDocuments, favoriteTools, recentDocumentsRaw] =
    await Promise.all([
      prisma.document.count({ where: { userId, isArchived: false } }),
      prisma.document.count({ where: { userId, isArchived: false, isPublished: true } }),
      prisma.document.count({ where: { userId, isArchived: false, isFavorite: true } }),
      prisma.favorite.count({ where: { userId, itemType: "aiTools" } }),
      prisma.document.findMany({
        where: { userId, isArchived: false },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          previewText: true,
          updatedAt: true,
          isPublished: true,
          isFavorite: true,
        },
        take: 3,
      }),
    ]);

  const recentDocuments: RecentDocument[] = recentDocumentsRaw.map((doc) => ({
    id: doc.id,
    title: doc.title || "Без названия",
    preview: extractPreviewText(doc.content, doc.previewText),
    updatedAt: doc.updatedAt,
    isPublished: doc.isPublished,
    isFavorite: doc.isFavorite,
  }));

  const stats = [
    {
      label: "Документов в работе",
      value: totalDocuments,
      hint: "Черновики, записи и проекты",
    },
    {
      label: "Опубликовано",
      value: publishedDocuments,
      hint: "Доступно вашей аудитории",
    },
    {
      label: "Избранные документы",
      value: favoriteDocuments,
      hint: "Быстрый доступ к важному",
    },
    {
      label: "Избранные AI-инструменты",
      value: favoriteTools,
      hint: "Личный список помощников",
    },
  ];

  const quickActions = [
    {
      title: "Документы и публикации",
      description: "Ведите конспекты, готовьте курсы и публикуйте материалы в один клик.",
      href: "/account/documents",
      icon: FileText,
      cta: "Открыть рабочее пространство",
    },
    {
      title: "Нейросети и ассистенты",
      description: "Выбирайте подходящие AI-инструменты для генерации, анализа и автоматизации.",
      href: "/catalog",
      icon: Sparkles,
      cta: "Исследовать каталог AI",
    },
    {
      title: "Блог и статьи",
      description: "Делитесь экспертными материалами и привлекайте аудиторию через блог.",
      href: "/blog",
      icon: PenLine,
      cta: "Перейти в блог",
    },
    {
      title: "Подборка избранного",
      description: "Сохраняйте инструменты и проекты, чтобы возвращаться к ним в любой момент.",
      href: "/account/favorites",
      icon: Heart,
      cta: "Смотреть избранное",
    },
  ];

  const highlights = [
    {
      title: "Создание документов",
      description: "Планируйте и структурируйте любые проекты от заметок до методичек.",
      icon: FileText,
    },
    {
      title: "Публикация в одно касание",
      description: "Готовый материал можно сразу сделать публичным и поделиться ссылкой.",
      icon: PenLine,
    },
    {
      title: "Поиск AI-инструментов",
      description: "Используйте каталог, чтобы подобрать нейросети под конкретные задачи.",
      icon: Bot,
    },
    {
      title: "Личный набор ассистентов",
      description: "Собирайте избранные решения и быстро возвращайтесь к ним.",
      icon: Heart,
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
                  <BreadcrumbPage>Личный кабинет</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-10 px-6 py-10">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr),380px]">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl">
              <div className="text-xs uppercase tracking-[0.35em] text-white/60">Workspace aiBazar</div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                {userName ? `Привет, ${userName}!` : "Добро пожаловать!"} Это ваш центр управления знаниями и AI-инструментами.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-white/75">
                Создавайте и публикуйте документы, подключайте нейросети и ведите собственный блог. Кабинет помогает держать все рабочие процессы в одном месте.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <CreateDocumentButton className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-slate-900 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:text-black" />
                <Link
                  href="/account/documents"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Перейти к документам
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 px-6 text-sm font-semibold text-white/90 transition hover:bg-white/20"
                >
                  Каталог AI-инструментов
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {highlights.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{title}</div>
                        <p className="mt-1 text-xs text-white/70">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-900">Как использовать кабинет</div>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  1. Создайте документ или загрузите заметки — рабочее пространство автоматически сохранит прогресс.
                </li>
                <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  2. Подберите подходящую нейросеть в каталоге и добавьте её в избранное, чтобы вернуться с любого устройства.
                </li>
                <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  3. Публикуйте статьи и делитесь ими с командой или аудиторией в блоге и социальных сетях.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Ваши показатели</h2>
              <Link href="/account/documents" className="text-sm font-medium text-slate-500 hover:text-slate-700">
                Смотреть все документы
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</div>
                  <div className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</div>
                  <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Быстрые действия</h2>
              <span className="text-sm text-slate-500">Выберите сценарий и продолжайте работу</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map(({ title, description, href, icon: Icon, cta }) => (
                <Link
                  key={title}
                  href={href}
                  className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-slate-900">{title}</div>
                      <p className="mt-2 text-sm text-slate-500">{description}</p>
                    </div>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    {cta}
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Последние документы</h2>
              <Link href="/account/documents" className="text-sm font-medium text-slate-500 hover:text-slate-700">
                Перейти к списку
              </Link>
            </div>
            {recentDocuments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                Здесь появятся ваши последние записи. Начните с создания первого документа.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/account/documents?doc=${doc.id}`}
                    className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDateLabel(doc.updatedAt)}</span>
                        <span>•</span>
                        <span>{formatTimeLabel(doc.updatedAt)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">
                        {doc.title}
                      </h3>
                      {doc.preview ? (
                        <p className="line-clamp-3 text-sm text-slate-500">{doc.preview}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Предпросмотр появится после заполнения документа.</p>
                      )}
                    </div>
                    <div className="mt-6 flex items-center gap-3 text-xs font-medium text-slate-600">
                      {doc.isPublished ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Опубликовано</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Черновик</span>
                      )}
                      {doc.isFavorite && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-600">Избранное</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr),340px]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Продолжайте развивать проекты</h2>
              <p className="mt-2 text-sm text-slate-500">
                Используйте блог, чтобы делиться результатами, и каталог AI-инструментов, чтобы ускорять рутину. Избранное помогает держать лучшие решения под рукой.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Читать блог
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/account/favorites"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Избранные инструменты
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Каталог AI
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-500 shadow-inner">
              <div className="text-sm font-semibold text-slate-700">Советы по работе</div>
              <ul className="mt-3 space-y-3">
                <li>Создайте шаблоны документов, чтобы запускать новые проекты быстрее.</li>
                <li>Добавляйте ключевые нейросети в избранное, чтобы иметь личный AI-ассистент.</li>
                <li>Публикуйте заметки и делитесь ими — кабинет сохранит структуру и оформление.</li>
              </ul>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

