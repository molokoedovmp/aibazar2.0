import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import BlockNoteViewer from "@/components/editor/BlockNoteViewerClient";
import { Clock, Eye, User } from "lucide-react";

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
    <div className="min-h-screen bg-white text-black dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />
      <section className="bg-black text-white py-12 sm:py-14">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 md:px-10">
          <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">{doc.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-white/80 sm:gap-4">
            <span className="flex items-center gap-1"><User className="w-4 h-4" />{authorName}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{pluralizeMinutes(doc.readTime)}</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{doc.views ?? 0}</span>
            <span className="ml-auto text-sm opacity-80">Обновлено: {doc.updatedAt.toLocaleDateString("ru-RU")}</span>
          </div>
        </div>
      </section>
      
      <section className="py-8 sm:py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 md:px-10">
          <article className="blog-article-viewer min-w-0 overflow-hidden rounded-3xl border border-black/10 bg-white/90 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/90 sm:py-8">
            <BlockNoteViewer content={doc.content} className="blog-article-content" />
          </article>
        </div>
      </section>
      <Footer />
    </div>
  );
}
