import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");
  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }
  const reviews = await prisma.review.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
  });
  const avg = await prisma.review.aggregate({
    where: { documentId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return NextResponse.json({
    reviews,
    avgRating: avg._avg.rating ?? 0,
    count: avg._count._all,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { documentId, author, content, rating } = body as {
    documentId?: string;
    author?: string;
    content?: string;
    rating?: number;
  };

  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 10) {
    return NextResponse.json({ error: "rating must be 1..10" }, { status: 400 });
  }
  const safeAuthor = (author || "Аноним").toString().slice(0, 60);
  const safeContent = (content || "").toString().slice(0, 4000);

  const created = await prisma.review.create({
    data: {
      documentId,
      author: safeAuthor,
      content: safeContent,
      rating: Math.round(r),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
