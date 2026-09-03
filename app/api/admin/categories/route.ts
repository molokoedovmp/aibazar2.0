import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Некорректные данные" }, { status: 400 });
  }

  const duplicate = await prisma.category.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return NextResponse.json({ error: "Такая категория уже существует" }, { status: 409 });

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon: parsed.data.icon || null,
    },
  });
  revalidatePath("/catalog");
  return NextResponse.json({ category }, { status: 201 });
}
