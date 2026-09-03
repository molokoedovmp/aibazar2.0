import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import { aiToolPatchSchema, normalizeAiToolPatch } from "@/lib/admin-validation";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

function refreshCatalog(id: string) {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${id}`);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = aiToolPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Некорректные данные" }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
    if (!category) return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
  }

  const tool = await prisma.aiTool.update({
    where: { id },
    data: normalizeAiToolPatch(parsed.data),
    include: { category: { select: { id: true, name: true, icon: true } } },
  }).catch(() => null);

  if (!tool) return NextResponse.json({ error: "Инструмент не найден" }, { status: 404 });
  refreshCatalog(id);
  return NextResponse.json({ tool });
}

export async function DELETE(_: Request, context: RouteContext) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;
  const tool = await prisma.aiTool.update({
    where: { id },
    data: { isActive: false },
    select: { id: true },
  }).catch(() => null);

  if (!tool) return NextResponse.json({ error: "Инструмент не найден" }, { status: 404 });
  refreshCatalog(id);
  return NextResponse.json({ ok: true });
}
