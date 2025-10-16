import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const docs = await prisma.document.findMany({
    where: { userId: session.user.id, isArchived: false },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, isFavorite: true, parentDocument: true },
  });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const title = body?.title || "Новый документ";
  const content = body?.content || "";
  const parentDocument = body?.parentDocument ?? null;

  const doc = await prisma.document.create({
    data: {
      title,
      content,
      userId: session.user.id,
      ...(parentDocument ? { parentDocument } : {}),
    },
    select: { id: true, title: true, content: true, updatedAt: true, parentDocument: true },
  });
  return NextResponse.json(doc, { status: 201 });
}
