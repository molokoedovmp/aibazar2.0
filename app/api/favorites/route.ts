import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/db";

const LIBRARY_ITEM_TYPES = ["mcp", "prompts", "skills", "repos"] as const;
const FAVORITE_ITEM_TYPES = ["aiTools", "documents", ...LIBRARY_ITEM_TYPES] as const;
type FavoriteItemType = (typeof FAVORITE_ITEM_TYPES)[number];

function isFavoriteItemType(value: string): value is FavoriteItemType {
  return FAVORITE_ITEM_TYPES.includes(value as FavoriteItemType);
}

function isLibraryItemType(value: FavoriteItemType) {
  return LIBRARY_ITEM_TYPES.includes(value as (typeof LIBRARY_ITEM_TYPES)[number]);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ isFavorited: false });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const rawItemType = searchParams.get("itemType") ?? "documents";
  if (!itemId) return NextResponse.json({ isFavorited: false });
  if (!isFavoriteItemType(rawItemType)) return NextResponse.json({ isFavorited: false });

  const fav = isLibraryItemType(rawItemType)
    ? await prisma.libraryFavorite.findUnique({
        where: {
          userId_itemId_itemType: { userId: session.user.id, itemId, itemType: rawItemType },
        },
        select: { id: true },
      })
    : await prisma.favorite.findFirst({
        where: { userId: session.user.id, itemId, itemType: rawItemType },
        select: { id: true },
      });
  return NextResponse.json({ isFavorited: !!fav });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const itemId = body?.itemId as string | undefined;
  const rawItemType = (body?.itemType as string | undefined) ?? "documents";
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  if (!isFavoriteItemType(rawItemType)) {
    return NextResponse.json({ error: "unsupported itemType" }, { status: 400 });
  }

  if (isLibraryItemType(rawItemType)) {
    const result = await prisma.libraryFavorite.upsert({
      where: {
        userId_itemId_itemType: { userId: session.user.id, itemId, itemType: rawItemType },
      },
      update: {},
      create: { userId: session.user.id, itemId, itemType: rawItemType },
    });
    return NextResponse.json({ ok: true, created: Boolean(result.id) });
  }

  const exists = await prisma.favorite.findFirst({
    where: { userId: session.user.id, itemId, itemType: rawItemType },
    select: { id: true },
  });
  if (exists) return NextResponse.json({ ok: true, created: false });

  await prisma.favorite.create({ data: { userId: session.user.id, itemId, itemType: rawItemType } });
  return NextResponse.json({ ok: true, created: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const itemId = body?.itemId as string | undefined;
  const rawItemType = (body?.itemType as string | undefined) ?? "documents";
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  if (!isFavoriteItemType(rawItemType)) {
    return NextResponse.json({ error: "unsupported itemType" }, { status: 400 });
  }

  const res = isLibraryItemType(rawItemType)
    ? await prisma.libraryFavorite.deleteMany({
        where: { userId: session.user.id, itemId, itemType: rawItemType },
      })
    : await prisma.favorite.deleteMany({
        where: { userId: session.user.id, itemId, itemType: rawItemType },
      });
  return NextResponse.json({ ok: true, deleted: res.count });
}

