import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import BlockNoteViewer from "@/components/editor/BlockNoteViewerClient";
import { Clock, Eye, Sparkles, User } from "lucide-react";

export const dynamic = "force-dynamic";

function pluralizeMinutes(minutes?: number | null) {
  if (!minutes && minutes !== 0) return "—";
  const m = Number(minutes) || 0;
  const last = m % 10;
  const last2 = m % 100;
  if (last2 >= 11 && last2 <= 14) return `${m} минут`;
  if (last === 1) return `${m} минута`;
  if (last >= 2 && last <= 4) return `${m} минуты`;
  return `${m} минут`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const getArticle = cache(async (id: string) =>
  prisma.document.findFirst({
    where: { id, isPublished: true },
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      previewText: true,
      readTime: true,
      views: true,
      userId: true,
      updatedAt: true,
    },
  }),
);

function articleDescription(previewText: string | null, title: string) {
  const normalized = (previewText || `Статья «${title}» о нейросетях и AI-инструментах в библиотеке aiBazar.`)
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= 158) return normalized;
  return `${normalized.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Статья не найдена", robots: { index: false } };

  const description = articleDescription(article.previewText, article.title);
  const canonical = `/blog/${encodeURIComponent(article.id)}`;

  return {
    title: article.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url: canonical,
      modifiedTime: article.updatedAt.toISOString(),
      images: article.coverImage ? [{ url: article.coverImage, alt: article.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function BlogArticle({ params }: PageProps) {
  const { id } = await params;
  const doc = await getArticle(id);

  if (!doc) return notFound();
  await prisma.document.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

  const author = doc ? await prisma.user.findUnique({ where: { id: doc.userId }, select: { name: true, email: true } }).catch(() => null) : null;
  const authorName = author?.name || (author?.email ? author.email.split("@")[0] : "Автор");

  return (
    <div className="route-plain-theme catalog-shadcn-theme min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(139,92,246,0.23),transparent_30%),radial-gradient(circle_at_70%_100%,rgba(16,185,129,0.16),transparent_28%)]" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20 md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/7 px-3 py-1.5 text-xs font-medium text-white/80">
            <Sparkles className="h-3.5 w-3.5" />Статья aiBazar
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">{doc.title}</h1>
          {doc.previewText ? <p className="mt-5 max-w-3xl text-base leading-7 text-white/65 sm:text-lg">{doc.previewText}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/55">
            <span className="flex items-center gap-1"><User className="w-4 h-4" />{authorName}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{pluralizeMinutes(doc.readTime)}</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{doc.views ?? 0}</span>
            <span className="sm:ml-auto">Обновлено: {doc.updatedAt.toLocaleDateString("ru-RU")}</span>
          </div>
        </div>
      </section>
      
      <section className="py-8 sm:py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 md:px-10">
          <article className="blog-article-viewer min-w-0 overflow-hidden rounded-3xl border border-border bg-card py-5 shadow-sm sm:py-8">
            <BlockNoteViewer content={doc.content} className="blog-article-content" />
          </article>
        </div>
      </section>
      <div className="border-t border-border"><Footer /></div>
    </div>
  );
}
