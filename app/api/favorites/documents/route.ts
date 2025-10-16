import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const favs = await prisma.favorite.findMany({
    where: { userId: session.user.id, itemType: "documents" },
    select: { itemId: true },
    take: 50,
  });
  const ids = favs.map((f) => f.itemId);
  if (ids.length === 0) return NextResponse.json([]);

  const docs = await prisma.document.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(docs);
}

