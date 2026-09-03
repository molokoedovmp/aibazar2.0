import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";

const roleSchema = z.object({ role: z.enum(["USER", "ADMIN"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { id } = await context.params;
  const parsed = roleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Неизвестная роль" }, { status: 400 });
  if (id === admin.user.id && parsed.data.role !== "ADMIN") {
    return NextResponse.json({ error: "Нельзя снять роль администратора у своей учётной записи" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  }).catch(() => null);
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  return NextResponse.json({ user });
}
