import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const startPriceUsd = Number(body?.startPriceUsd);
  const fxProvided = Number(body?.fx);
  if (!Number.isFinite(startPriceUsd) || startPriceUsd <= 0) {
    return NextResponse.json({ error: "startPriceUsd must be a positive number" }, { status: 400 });
  }

  const fx = Number.isFinite(fxProvided) && fxProvided > 0 ? fxProvided : await getUsdFx();
  const price = calcRubPrice(startPriceUsd, { fx });

  const updated = await prisma.aiTool.update({
    where: { id },
    data: {
      startPrice: startPriceUsd,
      price,
    },
    select: { id: true, startPrice: true, price: true, updatedAt: true },
  });

  return NextResponse.json({ ...updated, fx });
}

