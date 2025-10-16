import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;

  if (userId) {
    const personal = await prisma.userToolPrice
      .findUnique({ where: { userId_aiToolId: { userId, aiToolId: id } }, select: { startPriceUsd: true, priceRub: true, fx: true, updatedAt: true } })
      .catch(() => null);
    if (personal) return NextResponse.json({ ...personal, type: "personal" });
  }

  const tool = await prisma.aiTool.findUnique({ where: { id }, select: { startPrice: true, price: true } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fx = await getUsdFx();
  let priceRub: number | null = null;
  if (typeof tool.startPrice === "number") priceRub = calcRubPrice(tool.startPrice, { fx });
  else if (typeof tool.price === "number") priceRub = Math.round(tool.price);

  return NextResponse.json({ startPriceUsd: tool.startPrice ?? null, priceRub, fx, type: "base" });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const startPriceUsd = Number(body?.startPriceUsd);
  const fxProvided = Number(body?.fx);
  if (!Number.isFinite(startPriceUsd) || startPriceUsd <= 0) {
    return NextResponse.json({ error: "startPriceUsd must be a positive number" }, { status: 400 });
  }

  const fx = Number.isFinite(fxProvided) && fxProvided > 0 ? fxProvided : await getUsdFx();
  const priceRub = calcRubPrice(startPriceUsd, { fx });

  const up = await prisma.userToolPrice.upsert({
    where: { userId_aiToolId: { userId, aiToolId: id } },
    update: { startPriceUsd, fx, priceRub },
    create: { userId, aiToolId: id, startPriceUsd, fx, priceRub },
    select: { startPriceUsd: true, priceRub: true, fx: true, updatedAt: true },
  });

  return NextResponse.json({ ...up, type: "personal" });
}

