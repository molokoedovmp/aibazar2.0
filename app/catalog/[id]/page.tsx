import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, FileText, Layers3, Star, WalletCards } from "lucide-react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { ToolImage } from "@/app/components/ToolImage";
import FavoriteButton from "@/components/FavoriteButton";
import ToolPurchaseActions from "@/components/ToolPurchaseActions";
import BlockNoteViewer from "@/components/editor/BlockNoteViewerClient";
import Reviews from "@/components/reviews/Reviews";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";
import { relatedCategoryNames } from "@/lib/related-categories";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

function metadataDescription(value: string, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim() || fallback;
  if (normalized.length <= 158) return normalized;
  return `${normalized.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
}

function articleExcerpt(content?: string | null) {
  if (!content) return "";
  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      text = blocks
        .filter((block) => block?.type === "paragraph")
        .map((block) => {
          if (typeof block?.props?.text === "string") return block.props.text;
          if (!Array.isArray(block?.content)) return "";
          return block.content
            .map((node: { text?: unknown }) => (typeof node?.text === "string" ? node.text : ""))
            .filter(Boolean)
            .join(" ");
        })
        .filter((paragraph) => paragraph.trim().length > 0)
        .join(" ");
    }
  } catch {
    // Обычный текст не требует разбора.
  }
  const normalized = text.replace(/\s+/g, " ").trim();
  const sentences = normalized.match(/[^.!?…]+(?:[.!?…]+|$)/g);
  return (sentences?.slice(0, 2).join(" ") || normalized).trim();
}

const getToolSeoData = unstable_cache(
  async (id: string) =>
    prisma.aiTool.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        category: { select: { name: true } },
      },
    }),
  ["tool-seo-data"],
  { revalidate: 60, tags: ["tools"] },
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tool = await getToolSeoData(id);
  if (!tool) return { title: "AI-инструмент не найден", robots: { index: false } };

  const description = metadataDescription(
    tool.description,
    `${tool.name} — AI-инструмент из категории «${tool.category.name}». Описание, возможности и похожие решения в каталоге aiBazar.`,
  );
  const canonical = `/catalog/${encodeURIComponent(tool.id)}`;

  return {
    title: `${tool.name} — AI-инструмент: описание и возможности`,
    description,
    keywords: [tool.name, `${tool.name} AI`, tool.category.name, "AI-инструмент", "нейросеть"],
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${tool.name} — AI-инструмент`,
      description,
      url: canonical,
      images: tool.coverImage ? [{ url: tool.coverImage, alt: tool.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} — AI-инструмент`,
      description,
      images: tool.coverImage ? [tool.coverImage] : undefined,
    },
  };
}

export async function generateStaticParams() {
  try {
    const tools = await prisma.aiTool.findMany({ where: { isActive: true }, select: { id: true } });
    return tools.map((tool) => ({ id: tool.id }));
  } catch {
    return [];
  }
}

const getToolPageData = unstable_cache(
  async (id: string) => {
    const tool = await prisma.aiTool.findFirst({
      where: { id, isActive: true },
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
        select: { id: true, name: true, coverImage: true, rating: true },
        orderBy: [{ rating: "desc" }],
        take: 6,
      }),
      prisma.document.findMany({
        where: {
          isPublished: true,
          isArchived: false,
          ...(tool.linkedDocumentId ? { id: { not: tool.linkedDocumentId } } : {}),
        },
        select: { id: true, title: true, coverImage: true, previewText: true, content: true, readTime: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
      prisma.category.findMany({
        where: { name: { in: relatedNames }, aiTools: { some: { isActive: true } } },
        select: {
          id: true,
          name: true,
          icon: true,
          _count: { select: { aiTools: { where: { isActive: true } } } },
        },
      }),
    ]);

    relatedCategories.sort((left, right) => relatedNames.indexOf(left.name) - relatedNames.indexOf(right.name));
    return { tool, fx, linkedDocument, similarTools, recommendedArticles, relatedCategories: relatedCategories.slice(0, 6) };
  },
  ["tool-page-data"],
  { revalidate: 60, tags: ["tools"] },
);

export default async function ToolPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getToolPageData(id);
  if (!data) notFound();

  const { tool, fx, linkedDocument, similarTools, recommendedArticles, relatedCategories } = data;
  const canonicalUrl = `https://ai-bazar.ru/catalog/${encodeURIComponent(tool.id)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: metadataDescription(tool.description, `${tool.name} — AI-инструмент.`),
    url: canonicalUrl,
    applicationCategory: tool.category.name,
    operatingSystem: "Web",
    ...(tool.coverImage ? { image: tool.coverImage } : {}),
    ...(tool.url ? { sameAs: tool.url } : {}),
  };

  let computedRubPrice: number | null = null;
  try {
    if (typeof tool.startPrice === "number" && Number.isFinite(tool.startPrice) && tool.startPrice > 0) {
      computedRubPrice = calcRubPrice(tool.startPrice, { fx });
    } else if (typeof tool.price === "number" && tool.price > 0) {
      computedRubPrice = tool.price;
    }
  } catch {
    computedRubPrice = null;
  }

  const priceLabel =
    typeof tool.startPrice === "number" && tool.startPrice > 0
      ? `$${tool.startPrice.toLocaleString("en-US")}`
      : typeof computedRubPrice === "number"
        ? `${computedRubPrice.toLocaleString("ru-RU")} ₽`
        : "—";

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-black">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-black/55 transition hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Назад к AI-инструментам
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
          <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <ToolImage src={tool.coverImage} alt={tool.name} className="h-56 w-full object-cover sm:h-72 lg:h-full lg:min-h-[380px]" fallbackTextClassName="px-8 text-3xl sm:text-5xl" />
            <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium">{tool.category.name}</span>
                {tool.type ? <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium">{tool.type}</span> : null}
                {typeof tool.rating === "number" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{tool.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-black/35">Каталог AI-инструментов</p>
              <h1 className="mt-2 break-words text-3xl font-bold tracking-[-0.04em] sm:text-5xl">{tool.name}</h1>
              <p className="mt-5 line-clamp-4 text-sm leading-7 text-black/55 sm:text-base">{tool.description}</p>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                {tool.url ? (
                  <a href={tool.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/85 sm:w-fit">
                    <ExternalLink className="h-4 w-4" />Открыть официальный сайт
                  </a>
                ) : null}
                <FavoriteButton toolId={tool.id} callbackUrl={`/catalog/${tool.id}`} className="sm:w-auto" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Star} value={tool.rating?.toFixed(1) || "—"} label="Рейтинг" />
          <StatCard icon={WalletCards} value={priceLabel} label="Стоимость от" />
          <StatCard icon={CalendarDays} value={formatDate(tool.createdAt)} label="Добавлено" />
          <StatCard icon={Layers3} value={tool.type || "AI"} label="Тип инструмента" />
        </section>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Описание</h2>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-black/60 sm:text-base">{tool.description?.trim() || "Описание инструмента пока не добавлено."}</p>

            {linkedDocument?.content ? (
              <section className="mt-8 border-t border-black/10 pt-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Статья об инструменте</h2>
                  <Link href={linkedDocument.isPublished ? `/blog/${linkedDocument.id}` : `/account/documents?doc=${linkedDocument.id}`} className="text-sm text-black/50 underline transition hover:text-black">Открыть отдельно</Link>
                </div>
                <div className="tool-article-viewer mt-5 min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] py-5">
                  <BlockNoteViewer content={linkedDocument.content} />
                </div>
                <div className="mt-6"><Reviews documentId={linkedDocument.id} /></div>
              </section>
            ) : recommendedArticles.length > 0 ? (
              <section className="mt-8 border-t border-black/10 pt-7">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Полезные статьи</h2>
                  <Link href="/blog" className="text-sm text-black/50 underline hover:text-black">Все статьи</Link>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {recommendedArticles.map((article) => (
                    <Link key={article.id} href={`/blog/${article.id}`} className="group overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] transition hover:-translate-y-0.5">
                      <ToolImage src={article.coverImage} alt={article.title} className="h-32 w-full object-cover" fallbackTextClassName="text-lg" />
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs text-black/45"><FileText className="h-3.5 w-3.5" />{article.readTime ? `${article.readTime} мин` : "Статья"}</div>
                        <h3 className="mt-2 line-clamp-2 font-semibold group-hover:underline">{article.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-black/50">{articleExcerpt(article.content) || article.previewText}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:h-fit">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              <div className="bg-black p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Стоимость</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <span id="current-price-value" className="text-3xl font-semibold">{computedRubPrice ? `${computedRubPrice.toLocaleString("ru-RU")} ₽` : "—"}</span>
                  <span id="current-price-usd" className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{tool.startPrice ? `≈ $${tool.startPrice}` : "Цена по запросу"}</span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-xs text-white/60"><span>Курс USD</span><strong className="text-white">{fx.toFixed(2)} ₽</strong></div>
              </div>
              <div className="space-y-3 p-3">
                <ToolPurchaseActions toolId={tool.id} toolName={tool.name} toolDescription={tool.description} toolUrl={tool.url ?? undefined} initialRubPrice={computedRubPrice} initialStartPriceUsd={tool.startPrice && tool.startPrice > 0 ? tool.startPrice : null} fx={fx} />
              </div>
            </div>

            {similarTools.length > 0 ? (
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Похожие инструменты</h2>
                <div className="mt-4 space-y-2.5">
                  {similarTools.map((similar) => (
                    <Link key={similar.id} href={`/catalog/${similar.id}`} className="group flex min-w-0 items-center gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-2.5 transition hover:bg-black/[0.05]">
                      <ToolImage src={similar.coverImage} alt={similar.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" fallbackTextClassName="px-1 text-[8px]" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium group-hover:underline">{similar.name}</span>{typeof similar.rating === "number" ? <span className="mt-1 block text-xs text-black/45">★ {similar.rating.toFixed(1)}</span> : null}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {relatedCategories.length > 0 ? (
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Похожие категории</h2>
                <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {relatedCategories.map((category) => (
                    <Link key={category.id} href={`/catalog?category=${category.id}`} className="flex min-w-0 items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5 transition hover:bg-black/5">
                      {category.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={category.icon} alt="" className="h-4 w-4 shrink-0 object-contain dark:brightness-0 dark:invert" />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{category.name}</span><span className="text-[10px] text-black/40">{category._count.aiTools}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </main>

      <div className="border-t border-black/10"><Footer /></div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: typeof Star; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
      <Icon className="h-4 w-4 text-black/35" />
      <div className="mt-4 break-words text-xl font-semibold sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs text-black/45">{label}</div>
    </div>
  );
}
