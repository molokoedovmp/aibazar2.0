import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const itemId = body?.itemId as string | undefined;
  const itemType = (body?.itemType as string | undefined) ?? "documents";
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  // Prevent duplicates
  const exists = await prisma.favorite.findFirst({
    where: { userId: session.user.id, itemId, itemType },
    select: { id: true },
  });
  if (exists) return NextResponse.json({ ok: true, created: false });

  await prisma.favorite.create({
    data: { userId: session.user.id, itemId, itemType },
  });
  return NextResponse.json({ ok: true, created: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const itemId = body?.itemId as string | undefined;
  const itemType = (body?.itemType as string | undefined) ?? "documents";
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const res = await prisma.favorite.deleteMany({
    where: { userId: session.user.id, itemId, itemType },
  });
  return NextResponse.json({ ok: true, deleted: res.count });
}

