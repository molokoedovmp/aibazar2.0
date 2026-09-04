import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar"
import AISidebar from "@/components/editor/AISidebar";
import BlockNoteClient from "@/components/editor/BlockNoteClient";
import CreateDocumentButton from "@/components/account/CreateDocumentButton"
import DocumentActionsBar from "@/components/account/DocumentActionsBar";
import DocumentSearchInput from "@/components/account/DocumentSearchInput";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/db";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import DocHeaderTitle from "@/components/account/DocHeaderTitle";
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { FileText, Star } from "lucide-react";

interface SearchParams {
  doc?: string;
  q?: string;
}

type DocumentPreview = {
  id: string;
  title: string;
  preview: string;
  updatedAt: Date;
  createdAt: Date;
  isFavorite: boolean;
  isPublished: boolean;
  dateLabel: string;
  dayLabel: string;
};

type PreviewBlock = {
  type?: unknown;
  props?: { text?: unknown };
  content?: Array<{ text?: unknown }>;
};

type OpenDocument = {
  id: string;
  title: string;
  content: string | null;
  isFavorite: boolean;
  isPublished: boolean;
  updatedAt: Date;
};

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractPreviewText(content?: string | null, fallback?: string | null) {
  if (content) {
    try {
      const parsed: unknown = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const paragraphs = parsed
          .filter((block): block is PreviewBlock => {
            return typeof block === "object" && block !== null && (block as PreviewBlock).type === "paragraph";
          })
          .map((block) => {
            if (typeof block?.props?.text === "string") return block.props.text;
            const richText = block.content
              ?.map((node) => typeof node.text === "string" ? node.text : "")
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
      // treat as plain text below
      return shortenPreview(content);
    }
  }

  if (fallback) {
    return shortenPreview(fallback);
  }

  return "";
}

function shortenPreview(text: string, maxWords = 40) {
  const normalized = normalizeWhitespace(String(text ?? ""));
  if (!normalized) return "";
  const words = normalized.split(" ");
  if (words.length <= maxWords) return normalized;
  return words.slice(0, maxWords).join(" ") + "…";
}

function formatFullDate(date: Date) {
  try {
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatDayLabel(date: Date) {
  try {
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  } catch {
    return date.toISOString().slice(5, 10);
  }
}

function buildPreviews(docs: Array<{ id: string; title: string; previewText: string | null; content: string | null; updatedAt: Date; createdAt: Date; isFavorite: boolean; isPublished: boolean; }>): DocumentPreview[] {
  return docs.map((doc) => {
    const preview = extractPreviewText(doc.content, doc.previewText);
    const updatedAt = new Date(doc.updatedAt);
    return {
      id: doc.id,
      title: doc.title || "Без названия",
      preview,
      updatedAt,
      createdAt: new Date(doc.createdAt),
      isFavorite: doc.isFavorite,
      isPublished: doc.isPublished,
      dateLabel: formatFullDate(updatedAt),
      dayLabel: formatDayLabel(updatedAt),
    };
  });
}

function DocumentCard({ item }: { item: DocumentPreview }) {
  return (
    <Link
      href={`/account/documents?doc=${item.id}`}
      className="group min-w-0 rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
    >
      <article className="flex min-h-44 h-full min-w-0 flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
            <FileText className="h-4 w-4" />
          </span>
          {item.isFavorite ? (
            <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
          ) : null}
        </div>
        <h3 className="mt-4 line-clamp-2 text-base font-bold text-black dark:text-zinc-100">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-black/45 dark:text-zinc-400">
          {item.preview || "Предпросмотр появится после заполнения документа."}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/10 pt-4 text-[11px] text-black/35 dark:border-white/10 dark:text-zinc-500">
          <span>{item.dateLabel}</span>
          <span>{item.isPublished ? "Опубликован" : "Черновик"}</span>
        </div>
      </article>
    </Link>
  );
}

function isWithinDays(date: Date, days: number) {
  const diff = Date.now() - date.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { doc: docId, q } = await searchParams;

  // Guard: require authentication for the whole page
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  let doc: OpenDocument | null = null;
  try {
    if (docId) {
      doc = await prisma.document.findFirst({
        where: { id: docId, userId: session.user.id },
        select: { id: true, title: true, content: true, isFavorite: true, isPublished: true, updatedAt: true },
      });
    }
  } catch {}

  const searchTerm = q?.trim() ?? "";

  const documentList = await prisma.document.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
      parentDocument: null,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      previewText: true,
      content: true,
      updatedAt: true,
      createdAt: true,
      isFavorite: true,
      isPublished: true,
    },
    take: 120,
  });

  const previews = buildPreviews(documentList);
  const loweredSearch = searchTerm.toLowerCase();
  const filteredPreviews = searchTerm
    ? previews.filter((item) => {
        const haystack = `${item.title} ${item.preview}`.toLowerCase();
        return haystack.includes(loweredSearch);
      })
    : previews;

  const favorites = filteredPreviews.filter((item) => item.isFavorite);
  const nonFavoritePreviews = filteredPreviews.filter((item) => !item.isFavorite);
  const recent = nonFavoritePreviews.filter((item) => isWithinDays(item.updatedAt, 30));
  const older = nonFavoritePreviews.filter((item) => !isWithinDays(item.updatedAt, 30));
  const isSearching = Boolean(searchTerm);
  const searchPrimaryItems = isSearching ? nonFavoritePreviews : recent;
  const shouldShowPrimarySection = isSearching
    ? searchPrimaryItems.length > 0
    : recent.length > 0 || (!isSearching && favorites.length === 0 && nonFavoritePreviews.length > 0);
  const primarySectionItems = isSearching
    ? searchPrimaryItems
    : recent.length > 0
      ? recent
      : nonFavoritePreviews;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f6f6f3] dark:bg-zinc-950">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 dark:border-white/10 dark:bg-zinc-950 sm:px-6">
          <div className="flex flex-1 items-center gap-1.5">
            <SidebarTrigger className="text-black/60 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10" />
            <Separator orientation="vertical" className="h-7" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <DocHeaderTitle docId={doc?.id} defaultTitle={doc?.title ?? "Документы"} />
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-1.5">
            {!doc && (
              <DocumentSearchInput className="hidden md:block" placeholder="Поиск по документам" />
            )}
            <CreateDocumentButton className="hidden md:inline-flex bg-gray-900 text-white hover:bg-black" />
            {doc && (
              <div className="hidden md:flex">
                <DocumentActionsBar
                  docId={doc.id}
                  initialTitle={doc.title}
                  initialFavorite={Boolean(doc.isFavorite)}
                  initialPublished={Boolean(doc.isPublished)}
                />
              </div>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="md:hidden flex flex-col gap-2">
            {!doc && <DocumentSearchInput placeholder="Поиск по документам" />}
            {!doc && <CreateDocumentButton className="w-full bg-gray-900 text-white hover:bg-black" />}
            {doc && (
              <DocumentActionsBar
                docId={doc.id}
                initialTitle={doc.title}
                initialFavorite={Boolean(doc.isFavorite)}
                initialPublished={Boolean(doc.isPublished)}
              />
            )}
          </div>
          {!doc ? (
            <div className="space-y-8">
              <section className="border-b border-black/10 pb-6 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35 dark:text-zinc-500">
                  Рабочее пространство
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-black dark:text-zinc-100 sm:text-3xl">
                  Мои документы
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-black/50 dark:text-zinc-400">
                  Создавайте материалы, продолжайте редактирование и сохраняйте важные документы в избранном.
                </p>
              </section>
              {isSearching && filteredPreviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-300 bg-white px-8 py-12 text-center text-gray-600">
                  <p className="text-lg font-medium">По запросу «{searchTerm}» ничего не найдено.</p>
                  <p className="text-sm text-gray-500">Попробуйте изменить формулировку или создайте новый документ.</p>
                </div>
              ) : (
                <>
                  {favorites.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-baseline justify-between">
                        <h2 className="text-xs uppercase tracking-[0.35em] text-gray-500">Избранные</h2>
                        <span className="text-xs text-gray-400">{favorites.length} шт.</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {favorites.map((item) => <DocumentCard key={item.id} item={item} />)}
                      </div>
                    </section>
                  )}

                  {shouldShowPrimarySection && (
                    <section className="space-y-4">
                      <div className="flex items-baseline justify-between">
                        <h2 className="text-xs uppercase tracking-[0.35em] text-gray-500">
                          {isSearching ? "Результаты поиска" : "Предыдущие 30 дней"}
                        </h2>
                        <span className="text-xs text-gray-400">{primarySectionItems.length} шт.</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {primarySectionItems.map((item) => <DocumentCard key={item.id} item={item} />)}
                      </div>
                    </section>
                  )}

                  {!isSearching && older.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-baseline justify-between">
                        <h2 className="text-xs uppercase tracking-[0.35em] text-gray-500">Старые документы</h2>
                        <span className="text-xs text-gray-400">{older.length} шт.</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {older.map((item) => <DocumentCard key={item.id} item={item} />)}
                      </div>
                    </section>
                  )}

                  {filteredPreviews.length === 0 && !isSearching && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-gray-300 bg-white px-8 py-12 text-center text-gray-600">
                      <p className="text-lg font-medium">У вас пока нет документов.</p>
                      <p className="text-sm text-gray-500">Создайте первый документ, чтобы начать работу.</p>
                      <CreateDocumentButton className="inline-flex bg-gray-900 text-white hover:bg-black" />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-3">
              <AISidebar width="24rem" documentTitle={doc.title ?? "Документ"} />
              <div
                className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-black/10 bg-transparent p-3 shadow-sm dark:border-white/10 lg:order-1"
                style={{ height: "calc(100dvh - 7rem)", minHeight: 0 }}
              >
                <BlockNoteClient
                  key={doc.id}
                  id={doc.id}
                  initialTitle={doc.title}
                  initialContent={doc.content}
                  disableInlineAI
                />
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
