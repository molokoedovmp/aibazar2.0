import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type DocumentPatch = {
  title?: string;
  content?: string;
  isFavorite?: boolean;
  isPublished?: boolean;
  isArchived?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, content: true, updatedAt: true },
  });
  if (!document) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  return NextResponse.json(document);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawBody: unknown = await request.json().catch(() => null);
  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const body = rawBody as DocumentPatch;
  const data = {
    ...(typeof body.title === "string" ? { title: body.title } : {}),
    ...(typeof body.content === "string" ? { content: body.content } : {}),
    ...(typeof body.isFavorite === "boolean" ? { isFavorite: body.isFavorite } : {}),
    ...(typeof body.isPublished === "boolean" ? { isPublished: body.isPublished } : {}),
    ...(typeof body.isArchived === "boolean" ? { isArchived: body.isArchived } : {}),
  };

  const result = await prisma.document.updateMany({
    where: { id, userId: session.user.id },
    data,
  });
  if (!result.count) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
      isPublished: true,
      isFavorite: true,
      isArchived: true,
    },
  });

  return NextResponse.json(document);
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!document) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  await prisma.$transaction([
    prisma.document.updateMany({
      where: { userId: session.user.id, parentDocument: id },
      data: { parentDocument: null },
    }),
    prisma.document.delete({ where: { id } }),
  ]);

  return NextResponse.json({ id, deleted: true });
}
