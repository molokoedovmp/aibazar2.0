import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET(_: Request, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, content: true, updatedAt: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: Request, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, content, isFavorite, isPublished } = body as { title?: string; content?: string; isFavorite?: boolean; isPublished?: boolean };
  const doc = await prisma.document.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(typeof isFavorite === 'boolean' ? { isFavorite } : {}),
      ...(typeof isPublished === 'boolean' ? { isPublished } : {}),
    },
    select: { id: true, title: true, content: true, updatedAt: true, isPublished: true, isFavorite: true },
  });
  return NextResponse.json(doc);
}
