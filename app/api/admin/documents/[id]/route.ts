import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;
  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!document) {
    return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.document.updateMany({
      where: { parentDocument: id },
      data: { parentDocument: null },
    }),
    prisma.document.delete({ where: { id } }),
  ]);

  revalidatePath("/account/admin");
  revalidatePath("/account/admin/documents");
  revalidatePath("/account/documents");
  revalidatePath("/blog");

  return NextResponse.json({ id, deleted: true });
}
