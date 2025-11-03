import { notFound } from "next/navigation";
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

export default async function BlogArticle({ params }: { params: { id: string } }) {
  const doc = await prisma.document.findFirst({
    where: { id: params.id, isPublished: true },
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      readTime: true,
      views: true,
      userId: true,
      updatedAt: true,
    },
  });

  if (!doc) return notFound();
  await prisma.document.update({ where: { id: params.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const author = doc ? await prisma.user.findUnique({ where: { id: doc.userId }, select: { name: true, email: true } }).catch(() => null) : null;
  const authorName = author?.name || (author?.email ? author.email.split("@")[0] : "Автор");

  return (
    <div className="min-h-screen bg-white">
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
          <div className="blog-article-viewer rounded-2xl border border-black/10 p-3 sm:p-5 md:p-6">
            <BlockNoteViewer content={doc.content} className="blog-article-content" />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
