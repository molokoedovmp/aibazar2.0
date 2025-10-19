import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar"
import AISidebar from "@/components/editor/AISidebar";
import BlockNoteClient from "@/components/editor/BlockNoteClient";
import CreateDocumentButton from "@/components/account/CreateDocumentButton"
import DocumentActionsBar from "@/components/account/DocumentActionsBar";
import DocumentSearchInput from "@/components/account/DocumentSearchInput";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import DocHeaderTitle from "@/components/account/DocHeaderTitle";
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Star } from "lucide-react";

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

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
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
            const richText = block?.content?.map((n: any) => n?.text).filter(Boolean).join(" ");
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

  let doc: any = null;
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
      <SidebarInset className="bg-gradient-to-b from-white to-gray-100">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur">
          <div className="flex flex-1 items-center gap-3">
            <SidebarTrigger className="text-gray-700 hover:bg-gray-100" />
            <Separator orientation="vertical" className="h-8 border-gray-200" />
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
          <div className="flex items-center gap-3">
            <DocumentSearchInput className="hidden md:block" placeholder="Поиск по документам" />
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
        <div className="flex flex-1 flex-col gap-10 px-5 py-8">
          <div className="md:hidden flex flex-col gap-3">
            <DocumentSearchInput placeholder="Поиск по документам" />
            <CreateDocumentButton className="w-full bg-gray-900 text-white hover:bg-black" />
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
            <div className="space-y-10">
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
                      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {favorites.map((item) => (
                          <Link key={item.id} href={`/account/documents?doc=${item.id}`} className="group relative rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <article className="flex h-full flex-col justify-between gap-6">
                              <div className="space-y-3 text-sm text-gray-600">
                                {item.preview ? (
                                  <p className="leading-relaxed">
                                    {item.preview}
                                  </p>
                                ) : (
                                  <p className="text-gray-400">Предпросмотр появится после заполнения документа.</p>
                                )}
                              </div>
                              <div className="flex items-end justify-between gap-3">
                                <div className="max-w-[70%]">
                                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                                  <div className="mt-2 text-xs uppercase tracking-[0.3em] text-gray-400">{item.dateLabel}</div>
                                </div>
                                <div className="flex flex-col items-end text-xs text-gray-500">
                                  <span className="text-sm font-semibold text-gray-600">{item.dayLabel}</span>
                                  <span className="mt-1 text-[11px]">Заметки</span>
                                </div>
                              </div>
                              <Star className="absolute right-6 top-6 h-4 w-4 text-yellow-400" fill="currentColor" />
                            </article>
                          </Link>
                        ))}
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
                      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {primarySectionItems.map((item) => (
                          <Link key={item.id} href={`/account/documents?doc=${item.id}`} className="group relative rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <article className="flex h-full flex-col justify-between gap-6">
                              <div className="space-y-3 text-sm text-gray-600">
                                {item.preview ? (
                                  <p className="leading-relaxed">
                                    {item.preview}
                                  </p>
                                ) : (
                                  <p className="text-gray-400">Предпросмотр появится после заполнения документа.</p>
                                )}
                              </div>
                              <div className="flex items-end justify-between gap-3">
                                <div className="max-w-[70%]">
                                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                                  <div className="mt-2 text-xs uppercase tracking-[0.3em] text-gray-400">{item.dateLabel}</div>
                                </div>
                                <div className="flex flex-col items-end text-xs text-gray-500">
                                  <span className="text-sm font-semibold text-gray-600">{item.dayLabel}</span>
                                  <span className="mt-1 text-[11px]">Заметки</span>
                                </div>
                              </div>
                              {item.isFavorite && (
                                <Star className="absolute right-6 top-6 h-4 w-4 text-yellow-400" fill="currentColor" />
                              )}
                            </article>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {!isSearching && older.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-baseline justify-between">
                        <h2 className="text-xs uppercase tracking-[0.35em] text-gray-500">Старые документы</h2>
                        <span className="text-xs text-gray-400">{older.length} шт.</span>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {older.map((item) => (
                          <Link key={item.id} href={`/account/documents?doc=${item.id}`} className="group relative rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <article className="flex h-full flex-col justify-between gap-6">
                              <div className="space-y-3 text-sm text-gray-600">
                                {item.preview ? (
                                  <p className="leading-relaxed">
                                    {item.preview}
                                  </p>
                                ) : (
                                  <p className="text-gray-400">Предпросмотр появится после заполнения документа.</p>
                                )}
                              </div>
                              <div className="flex items-end justify-between gap-3">
                                <div className="max-w-[70%]">
                                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                                  <div className="mt-2 text-xs uppercase tracking-[0.3em] text-gray-400">{item.dateLabel}</div>
                                </div>
                                <div className="flex flex-col items-end text-xs text-gray-500">
                                  <span className="text-sm font-semibold text-gray-600">{item.dayLabel}</span>
                                  <span className="mt-1 text-[11px]">Заметки</span>
                                </div>
                              </div>
                              {item.isFavorite && (
                                <Star className="absolute right-6 top-6 h-4 w-4 text-yellow-400" fill="currentColor" />
                              )}
                            </article>
                          </Link>
                        ))}
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
            <div className="flex flex-1 min-h-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-5">
              <div
                className="flex-1 min-h-0 min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
                style={{ height: "calc(100dvh - 5rem - 4rem)", minHeight: 0 }}
              >
                <BlockNoteClient
                  key={doc.id}
                  id={doc.id}
                  initialTitle={doc.title}
                  initialContent={doc.content}
                  disableInlineAI
                />
              </div>
              <AISidebar width="21rem" documentTitle={doc.title ?? "Документ"} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
