import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import BlockNoteViewer from "@/components/editor/BlockNoteViewerClient";
import Reviews from "@/components/reviews/Reviews";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";
import { relatedCategoryNames } from "@/lib/related-categories";
import ToolPurchaseActions from "@/components/ToolPurchaseActions";
import { Button } from "@/components/ui/button";
import { ToolImage } from "@/app/components/ToolImage";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

function articleExcerpt(content?: string | null) {
  if (!content) return "";

  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      const paragraphText = blocks
        .filter((block) => block?.type === "paragraph")
        .map((block) => {
          if (typeof block?.props?.text === "string") return block.props.text;
          if (!Array.isArray(block?.content)) return "";
          return block.content
            .map((node: { text?: unknown }) => (typeof node?.text === "string" ? node.text : ""))
            .filter(Boolean)
            .join(" ");
        })
        .filter((paragraph) => paragraph.trim().length > 0);

      text = paragraphText.join(" ");
    }
  } catch {
    // Обычный текст не требует разбора.
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const sentences = normalized.match(/[^.!?…]+(?:[.!?…]+|$)/g);
  return (sentences?.slice(0, 2).join(" ") || normalized).trim();
}

export async function generateStaticParams() {
  try {
    const tools = await prisma.aiTool.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return tools.map((t) => ({ id: t.id }));
  } catch {
    return [];
  }
}

const getToolPageData = unstable_cache(
  async (id: string) => {
    const tool = await prisma.aiTool.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!tool) return null;

    const relatedNames = relatedCategoryNames(tool.category.name);
    const [fx, linkedDocument, similarTools, recommendedArticles, relatedCategories] = await Promise.all([
      getUsdFx(),
      tool.linkedDocumentId
        ? prisma.document.findUnique({
            where: { id: tool.linkedDocumentId },
            select: { id: true, title: true, content: true, isPublished: true },
          })
        : Promise.resolve(null),
      prisma.aiTool.findMany({
        where: { isActive: true, categoryId: tool.categoryId, id: { not: id } },
        select: { id: true, name: true, coverImage: true, rating: true, url: true },
        orderBy: [{ rating: "desc" }],
        take: 6,
      }),
      prisma.document.findMany({
        where: {
          isPublished: true,
          isArchived: false,
          ...(tool.linkedDocumentId ? { id: { not: tool.linkedDocumentId } } : {}),
        },
        select: {
          id: true,
          title: true,
          coverImage: true,
          previewText: true,
          content: true,
          readTime: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.category.findMany({
        where: {
          name: { in: relatedNames },
          aiTools: { some: { isActive: true } },
        },
        select: {
          id: true,
          name: true,
          icon: true,
          _count: { select: { aiTools: { where: { isActive: true } } } },
        },
      }),
    ]);

    relatedCategories.sort(
      (left, right) => relatedNames.indexOf(left.name) - relatedNames.indexOf(right.name),
    );

    return {
      tool,
      fx,
      linkedDocument,
      similarTools,
      recommendedArticles,
      relatedCategories: relatedCategories.slice(0, 6),
    };
  },
  ["tool-page-data"],
  { revalidate: 60, tags: ["tools"] }
);

export default async function ToolPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getToolPageData(id);
  if (!data) return notFound();

  const { tool, fx, linkedDocument, similarTools, recommendedArticles, relatedCategories } = data;

  let computedRubPrice: number | null = null;
  try {
    if (typeof tool.startPrice === "number" && Number.isFinite(tool.startPrice) && tool.startPrice > 0) {
      computedRubPrice = calcRubPrice(tool.startPrice, { fx });
    } else if (typeof tool.price === "number" && tool.price > 0) {
      computedRubPrice = tool.price;
    }
  } catch {}

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,2.1fr)_minmax(420px,1fr)]">
          <div className="space-y-6 lg:col-start-1 lg:row-start-1">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-sm text-black/70 dark:text-white/70 hover:underline"
            >
              ← Назад к каталогу
            </Link>
            <ToolImage
              src={tool.coverImage}
              alt={tool.name}
              className="h-72 w-full rounded-lg object-cover"
              fallbackTextClassName="text-3xl sm:text-4xl"
            />
            <h1 className="text-3xl font-bold text-black dark:text-white">{tool.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-black/70 dark:text-white/70">
              {tool.category?.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tool.category.icon}
                  alt={tool.category?.name || "Категория"}
                  className="h-4 w-4"
                />
              )}
              {tool.category?.name && <span>{tool.category.name}</span>}
              {typeof tool.rating === "number" && <span>⭐ {tool.rating.toFixed(1)}</span>}
            </div>
            <div className="rounded-xl border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="text-lg font-semibold text-black dark:text-white">Описание</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-black/70 dark:text-white/70">
                {tool.description?.trim() || "Описание инструмента пока не добавлено."}
              </p>
            </div>
          </div>
          <aside className="lg:col-start-2 lg:row-start-1 lg:mt-11">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-950">
              <div className="bg-gradient-to-br from-black via-neutral-900 to-zinc-800 px-4 py-4 text-white dark:from-white/10 dark:via-white/5 dark:to-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-white/60">Тариф</div>
                    <div className="mt-4 flex items-baseline gap-3">
                      <span id="current-price-value" className="text-4xl font-semibold leading-none">
                        {typeof computedRubPrice === "number" && computedRubPrice > 0
                          ? `${computedRubPrice.toLocaleString("ru-RU")} ₽`
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <span
                    id="current-price-usd"
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80"
                  >
                    {typeof tool.startPrice === "number" && tool.startPrice > 0
                      ? `≈ $${tool.startPrice}`
                      : "—"}
                  </span>
                </div>
                <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white/70">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wide">Курс USD</span>
                    <span className="text-sm font-semibold text-white">{fx.toFixed(2)} ₽</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/60">Цена конвертируется автоматически по актуальному курсу.</p>
                </div>
              </div>
              <div className="space-y-3 px-3 py-3">
                <ToolPurchaseActions
                  toolId={tool.id}
                  toolName={tool.name}
                  toolDescription={tool.description}
                  toolUrl={tool.url ?? undefined}
                  initialRubPrice={computedRubPrice}
                  initialStartPriceUsd={
                    typeof tool.startPrice === "number" && tool.startPrice > 0
                      ? tool.startPrice
                      : null
                  }
                  fx={fx}
                />
              </div>
            </div>
          </aside>

          <div className="lg:col-start-1 lg:row-start-2 lg:flex lg:h-full lg:flex-col">
            {linkedDocument?.content && (
              <div>
                <h2 className="mb-3 text-xl font-semibold text-black dark:text-white">Статья об инструменте</h2>

                {/* Desktop (>=lg): полный текст статьи с отзывами */}
                <div className="hidden lg:block">
                  <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                    <BlockNoteViewer content={linkedDocument.content} />
                  </div>
                  <div className="mt-3 flex gap-3">
                    <a
                      href={linkedDocument.isPublished ? `/blog/${linkedDocument.id}` : `/account/documents?doc=${linkedDocument.id}`}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      target={linkedDocument.isPublished ? "_blank" : undefined}
                      rel="noopener noreferrer"
                    >
                      Открыть документ {linkedDocument.title ? `– ${linkedDocument.title}` : "в новой вкладке"}
                    </a>
                  </div>
                  <div className="mt-4">
                    <Reviews documentId={linkedDocument.id} />
                  </div>
                </div>

                {/* Mobile/Tablet (<lg): только кнопка-ссылка на статью, без текста */}
                <div className="block lg:hidden">
                  <Button variant="outline" asChild className="px-4 py-2">
                    <a
                      href={linkedDocument.isPublished ? `/blog/${linkedDocument.id}` : `/account/documents?doc=${linkedDocument.id}`}
                      target={linkedDocument.isPublished ? "_blank" : undefined}
                      rel="noopener noreferrer"
                    >
                      Читать статью{linkedDocument.title ? ` – ${linkedDocument.title}` : ""}
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {!linkedDocument?.content && recommendedArticles.length > 0 && (
              <section className="lg:flex lg:h-full lg:flex-col">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-black dark:text-white">Полезные статьи</h2>
                    <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                      У этого инструмента пока нет отдельной статьи — посмотрите другие материалы.
                    </p>
                  </div>
                  <Link href="/blog" className="shrink-0 text-sm text-blue-600 hover:underline dark:text-blue-400">
                    Все статьи
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex-1 lg:auto-rows-fr">
                  {recommendedArticles.map((article) => {
                    const preview = articleExcerpt(article.content) || article.previewText?.trim();

                    return (
                      <Link
                        key={article.id}
                        href={`/blog/${article.id}`}
                        className="group h-full overflow-hidden rounded-xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-950"
                      >
                        <ToolImage
                          src={article.coverImage}
                          alt={article.title}
                          className="h-32 w-full object-cover"
                          fallbackTextClassName="text-lg"
                        />
                        <div className="p-4">
                          <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{article.readTime ? `${article.readTime} мин` : "Статья"}</span>
                          </div>
                          <h3 className="mt-2 line-clamp-2 font-semibold text-black group-hover:underline dark:text-white">
                            {article.title}
                          </h3>
                          {preview && (
                            <p className="mt-2 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                              {preview}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:col-start-2 lg:row-start-2">
            {/* Похожие инструменты */}
            <div className="rounded-xl border border-black/10 dark:border-white/10 p-5 shadow-sm">
              <div className="mb-3 text-sm font-medium text-black dark:text-white">Похожие инструменты</div>
              {similarTools.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {similarTools.map((t) => (
                    <Link
                      key={t.id}
                      href={`/catalog/${t.id}`}
                      className="group flex min-w-0 items-center gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-2.5 transition hover:-translate-y-0.5 hover:bg-black/[0.04] hover:shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                    >
                      <ToolImage
                        src={t.coverImage}
                        alt={t.name}
                        className="h-14 w-14 shrink-0 rounded-lg border border-black/10 object-cover dark:border-white/10"
                        fallbackTextClassName="line-clamp-2 px-1 text-[8px]"
                      />
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm font-medium leading-5 text-black group-hover:underline dark:text-white">
                          {t.name}
                        </div>
                        {typeof t.rating === "number" && (
                          <div className="mt-1 text-xs text-black/55 dark:text-white/55">
                            ⭐ {t.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-black/60 dark:text-white/60">Нет похожих инструментов</div>
              )}
            </div>

            {relatedCategories.length > 0 && (
              <div className="rounded-xl border border-black/10 p-5 shadow-sm dark:border-white/10">
                <div className="mb-3 text-sm font-medium text-black dark:text-white">
                  Похожие категории
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {relatedCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/catalog?category=${category.id}`}
                      className="group flex min-w-0 items-center gap-2 rounded-lg border border-black/10 px-3 py-2.5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                    >
                      {category.icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={category.icon} alt="" className="h-4 w-4 shrink-0 object-contain" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-black group-hover:underline dark:text-white">
                          {category.name}
                        </span>
                        <span className="block text-[10px] text-black/50 dark:text-white/50">
                          {category._count.aiTools} инструментов
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </aside>
        </div>

      </main>
      <Footer />
    </div>
  );
}
