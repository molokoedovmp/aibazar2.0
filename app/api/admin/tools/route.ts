import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import { aiToolInputSchema, normalizeAiToolInput } from "@/lib/admin-validation";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const includeInactive = searchParams.get("includeInactive") === "true";
  const limit = 30;
  const where = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(query ? {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { category: { name: { contains: query, mode: "insensitive" as const } } },
      ],
    } : {}),
  };

  const [tools, total] = await Promise.all([
    prisma.aiTool.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: { id: true, name: true, icon: true } } },
    }),
    prisma.aiTool.count({ where }),
  ]);

  return NextResponse.json({ tools, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const parsed = aiToolInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Некорректные данные" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
  if (!category) return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });

  const tool = await prisma.aiTool.create({
    data: normalizeAiToolInput(parsed.data),
    include: { category: { select: { id: true, name: true, icon: true } } },
  });

  revalidatePath("/");
  revalidatePath("/catalog");
  return NextResponse.json({ tool }, { status: 201 });
}
