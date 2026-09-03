import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";

const orderSchema = z.object({
  status: z.enum(["pending", "waiting_for_capture", "paid", "succeeded", "canceled", "failed", "refunded"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Неизвестный статус заказа" }, { status: 400 });

  const paid = parsed.data.status === "paid" || parsed.data.status === "succeeded";
  const order = await prisma.aiToolOrder.update({
    where: { id },
    data: { status: parsed.data.status, paidAt: paid ? new Date() : undefined },
    select: { id: true, status: true, paidAt: true },
  }).catch(() => null);
  if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  return NextResponse.json({ order });
}
