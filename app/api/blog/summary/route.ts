import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const docs = await prisma.document.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      previewText: true,
      readTime: true,
      views: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const ids = docs.map((d) => d.id);
  const userIds = Array.from(new Set(docs.map((d) => d.userId).filter(Boolean))) as string[];
  const grouped = ids.length
    ? await prisma.review.groupBy({
        by: ["documentId"],
        where: { documentId: { in: ids } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const avgMap = new Map(grouped.map((g) => [g.documentId, g._avg.rating]));

  // resolve author names
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const userMap = new Map(
    users.map((u) => [u.id, u.name || (u.email ? u.email.split("@")[0] : "Автор")])
  );

  const payload = docs.map((d) => ({
    ...d,
    averageRating: avgMap.get(d.id) ?? 0,
    authorName: userMap.get(d.userId) ?? "Автор",
  }));

  return NextResponse.json(payload);
}
