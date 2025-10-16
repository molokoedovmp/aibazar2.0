import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const items = await prisma.favorite.findMany({
    where: { userId: session.user.id, itemType: "aiTools" },
    select: {
      itemId: true,
      aiTool: { select: { id: true, name: true, coverImage: true, rating: true, url: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tools = items
    .map((it) => it.aiTool)
    .filter(Boolean);

  return NextResponse.json(tools);
}





