import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import {
  isAdminLibraryType,
  mcpAdminSchema,
  promptAdminSchema,
  repoAdminSchema,
  skillAdminSchema,
} from "@/lib/admin-library-validation";
import { prisma } from "@/lib/db";

type Context = { params: Promise<{ type: string; id: string }> };

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "resource";
}

function refreshLibrary() {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/blog");
  revalidatePath("/account/admin");
}

export async function PATCH(request: Request, context: Context) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  const { type, id } = await context.params;
  if (!isAdminLibraryType(type)) return NextResponse.json({ error: "Неизвестный раздел" }, { status: 400 });
  const body = await request.json().catch(() => null);

  try {
    if (type === "mcp") {
      const parsed = mcpAdminSchema.partial().safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      const value = parsed.data;
      const item = await prisma.mcpResource.update({ where: { id }, data: {
        ...value,
        ...(value.githubUrl !== undefined ? { githubUrl: value.githubUrl || null } : {}),
        ...(value.websiteUrl !== undefined ? { websiteUrl: value.websiteUrl || null } : {}),
        ...(value.author !== undefined ? { author: value.author || null } : {}),
        ...(value.languageName !== undefined ? { languageName: value.languageName || null, languageSlug: value.languageName ? slugify(value.languageName) : null } : {}),
        ...(value.categoryNames !== undefined ? { categoryNames: value.categoryNames, categorySlugs: value.categoryNames.map(slugify) } : {}),
        ...(value.location !== undefined ? { location: value.location || null } : {}),
        ...(value.license !== undefined ? { license: value.license || null } : {}),
      } });
      refreshLibrary();
      return NextResponse.json({ item });
    }

    if (type === "prompts") {
      const parsed = promptAdminSchema.partial().safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      const value = parsed.data;
      const item = await prisma.promptResource.update({ where: { id }, data: {
        ...value,
        ...(value.titleRu !== undefined ? { titleRu: value.titleRu || null } : {}),
        ...(value.description !== undefined ? { description: value.description || null } : {}),
        ...(value.descriptionRu !== undefined ? { descriptionRu: value.descriptionRu || null } : {}),
        ...(value.authorName !== undefined ? { authorName: value.authorName || null } : {}),
      } });
      refreshLibrary();
      return NextResponse.json({ item });
    }

    if (type === "skills") {
      const parsed = skillAdminSchema.partial().safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      const value = parsed.data;
      const item = await prisma.skillResource.update({ where: { id }, data: {
        ...value,
        ...(value.descriptionRu !== undefined ? { descriptionRu: value.descriptionRu || null } : {}),
        ...(value.author !== undefined ? { author: value.author || null } : {}),
        ...(value.repoUrl !== undefined ? { repoUrl: value.repoUrl || null } : {}),
        ...(value.sourceLanguage !== undefined ? { sourceLanguage: value.sourceLanguage || null } : {}),
        ...(value.installCommand !== undefined ? { installCommand: value.installCommand || null } : {}),
        ...(value.category !== undefined ? { category: value.category || null } : {}),
      } });
      refreshLibrary();
      return NextResponse.json({ item });
    }

    const parsed = repoAdminSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const value = parsed.data;
    const item = await prisma.repositoryResource.update({ where: { id }, data: {
      ...value,
      ...(value.owner !== undefined ? { owner: value.owner || null } : {}),
      ...(value.repositoryName !== undefined ? { repositoryName: value.repositoryName || null } : {}),
      ...(value.descriptionRu !== undefined ? { descriptionRu: value.descriptionRu || null } : {}),
      ...(value.language !== undefined ? { language: value.language || null } : {}),
      ...(value.url ? { sourceUrl: value.url } : {}),
      lastSeenAt: new Date(),
    } });
    refreshLibrary();
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Admin library update error:", error);
    return NextResponse.json({ error: "Не удалось обновить ресурс" }, { status: 409 });
  }
}

export async function DELETE(_: Request, context: Context) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  const { type, id } = await context.params;
  if (!isAdminLibraryType(type)) return NextResponse.json({ error: "Неизвестный раздел" }, { status: 400 });

  try {
    if (type === "mcp") await prisma.mcpResource.update({ where: { id }, data: { isActive: false } });
    else if (type === "prompts") await prisma.promptResource.update({ where: { id }, data: { isActive: false } });
    else if (type === "skills") await prisma.skillResource.update({ where: { id }, data: { isActive: false } });
    else await prisma.repositoryResource.update({ where: { id }, data: { isActive: false } });
    refreshLibrary();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ресурс не найден" }, { status: 404 });
  }
}
