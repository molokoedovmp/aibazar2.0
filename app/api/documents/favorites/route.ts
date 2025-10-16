import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });
  const docs = await prisma.document.findMany({
    where: { userId: session.user.id, isArchived: false, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json(docs);
}

