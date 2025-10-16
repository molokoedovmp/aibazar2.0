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
      <section className="bg-black text-white py-14">
        <div className="container mx-auto px-6 md:px-10">
          <h1 className="text-3xl md:text-5xl font-black leading-tight">{doc.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-white/80">
            <span className="flex items-center gap-1"><User className="w-4 h-4" />{authorName}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{pluralizeMinutes(doc.readTime)}</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{doc.views ?? 0}</span>
            <span className="ml-auto text-sm">Обновлено: {doc.updatedAt.toLocaleDateString("ru-RU")}</span>
          </div>
        </div>
      </section>
      
      <section className="py-10">
        <div className="container mx-auto px-6 md:px-10">
          <div className="rounded-xl border border-black/10 p-4 md:p-6">
            <BlockNoteViewer content={doc.content} />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
