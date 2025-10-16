import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import BlockNoteViewer from "@/components/editor/BlockNoteViewerClient";
import Reviews from "@/components/reviews/Reviews";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ToolPurchaseActions from "@/components/ToolPurchaseActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ToolPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const tool = await prisma.aiTool.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!tool) return notFound();

  // Выполняем параллельно независимые запросы (сильно снижает TTFB)
  const [fx, linkedDocument, similarTools, categories, fav] = await Promise.all([
    getUsdFx(),
    tool.linkedDocumentId
      ? prisma.document.findUnique({
          where: { id: tool.linkedDocumentId },
          select: { id: true, title: true, content: true, isPublished: true },
        })
      : Promise.resolve(null),
    prisma.aiTool.findMany({
      where: { isActive: true, categoryId: tool.categoryId, id: { not: tool.id } },
      select: { id: true, name: true, coverImage: true, rating: true, url: true },
      orderBy: [{ rating: 'desc' }],
      take: 6,
    }),
    prisma.category.findMany({ select: { id: true, name: true, icon: true }, orderBy: { name: 'asc' } }),
    session?.user?.id
      ? prisma.favorite.findFirst({ where: { itemId: id, itemType: 'aiTools', userId: session.user.id } })
      : Promise.resolve(null),
  ]);

  let computedRubPrice: number | null = null;
  try {
    if (typeof tool.startPrice === "number" && Number.isFinite(tool.startPrice)) {
      computedRubPrice = calcRubPrice(tool.startPrice, { fx });
    } else if (typeof tool.price === "number") {
      computedRubPrice = tool.price;
    }
  } catch {}

  const isFavoritedInitial = !!fav;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 text-sm text-black/70 dark:text-white/70 hover:underline"
            >
              ← Назад к каталогу
            </a>
            {tool.coverImage && (
              <img src={tool.coverImage} alt={tool.name} className="w-full h-72 object-cover rounded-lg" />
            )}
            <h1 className="text-3xl font-bold text-black dark:text-white">{tool.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-black/70 dark:text-white/70">
              {tool.category?.icon && (
                <img
                  src={tool.category.icon}
                  alt={tool.category?.name || "Категория"}
                  className="h-4 w-4"
                />
              )}
              {tool.category?.name && <span>{tool.category.name}</span>}
              {typeof tool.rating === "number" && <span>⭐ {tool.rating.toFixed(1)}</span>}
            </div>
            {linkedDocument?.content && (
              <div className="mt-2">
                <h2 className="text-xl font-semibold text-black dark:text-white mb-3">Описание и подробности</h2>
                <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
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
                <Reviews documentId={linkedDocument.id} />
              </div>
            )}
          </div>
          <aside className="space-y-5 lg:mt-11">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-950">
              <div className="bg-gradient-to-br from-black via-neutral-900 to-zinc-800 px-4 py-4 text-white dark:from-white/10 dark:via-white/5 dark:to-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-white/60">Тариф</div>
                    <div className="mt-4 flex items-baseline gap-3">
                      <span id="current-price-value" className="text-4xl font-semibold leading-none">
                        {typeof computedRubPrice === "number" ? `${computedRubPrice.toLocaleString('ru-RU')} ₽` : "Бесплатно"}
                      </span>
                    </div>
                  </div>
                  <span
                    id="current-price-usd"
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80"
                  >
                    {typeof tool.startPrice === "number" ? `≈ $${tool.startPrice}` : "—"}
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
                  initialStartPriceUsd={typeof tool.startPrice === 'number' ? tool.startPrice : null}
                  fx={fx}
                  isFavoritedInitial={isFavoritedInitial}
                />
              </div>
            </div>

            {/* Похожие инструменты */}
            <div className="rounded-xl border border-black/10 dark:border-white/10 p-5 shadow-sm">
              <div className="mb-3 text-sm font-medium text-black dark:text-white">Похожие инструменты</div>
              {similarTools.length > 0 ? (
                <div className="space-y-3">
                  {similarTools.map((t) => (
                    <a key={t.id} href={`/catalog/${t.id}`} className="flex items-center gap-3 group">
                      {t.coverImage ? (
                        <img src={t.coverImage} alt={t.name} className="h-10 w-10 rounded object-cover border border-black/10 dark:border-white/10" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-black/5 dark:bg-white/10" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-black dark:text-white group-hover:underline">{t.name}</div>
                        <div className="text-xs text-black/60 dark:text-white/60">{typeof t.rating === 'number' ? `⭐ ${t.rating.toFixed(1)}` : ''}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-black/60 dark:text-white/60">Нет похожих инструментов</div>
              )}
            </div>

            {/* Категории */}
            <div className="rounded-xl border border-black/10 dark:border-white/10 p-5 shadow-sm">
              <div className="mb-3 text-sm font-medium text-black dark:text-white">Категории</div>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((c) => (
                  <a key={c.id} href={`/catalog?category=${c.id}`} className="flex items-center gap-2 rounded-md border border-black/10 dark:border-white/10 px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10">
                    {c.icon && <img src={c.icon} alt={c.name} className="h-4 w-4" />}
                    <span className="text-sm text-black dark:text-white truncate">{c.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
