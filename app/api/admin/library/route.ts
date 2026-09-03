import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import {
  isAdminLibraryType,
  mcpAdminSchema,
  promptAdminSchema,
  repoAdminSchema,
  skillAdminSchema,
} from "@/lib/admin-library-validation";
import { prisma } from "@/lib/db";

const LIMIT = 30;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "resource";
}

function manualId() {
  return `manual:${randomUUID()}`;
}

function refreshLibrary() {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/account/admin");
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const requestedType = request.nextUrl.searchParams.get("type");
  if (!isAdminLibraryType(requestedType)) return NextResponse.json({ error: "Неизвестный раздел" }, { status: 400 });
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const skip = (page - 1) * LIMIT;
  const active = includeInactive ? {} : { isActive: true };

  if (requestedType === "mcp") {
    const where = {
      ...active,
      ...(query ? { OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { author: { contains: query, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.mcpResource.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        skip,
        take: LIMIT,
        select: {
          id: true, name: true, description: true, author: true, githubUrl: true, websiteUrl: true,
          resourceType: true, languageName: true, tags: true, categoryNames: true, rating: true,
          stars: true, location: true, license: true, isOfficial: true, isActive: true, updatedAt: true,
        },
      }),
      prisma.mcpResource.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pages: Math.max(1, Math.ceil(total / LIMIT)) });
  }

  if (requestedType === "prompts") {
    const where = {
      ...active,
      ...(query ? { OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { titleRu: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { descriptionRu: { contains: query, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.promptResource.findMany({ where, orderBy: [{ updatedAt: "desc" }, { title: "asc" }], skip, take: LIMIT }),
      prisma.promptResource.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pages: Math.max(1, Math.ceil(total / LIMIT)) });
  }

  if (requestedType === "skills") {
    const where = {
      ...active,
      ...(query ? { OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { descriptionRu: { contains: query, mode: "insensitive" as const } },
        { author: { contains: query, mode: "insensitive" as const } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.skillResource.findMany({ where, orderBy: [{ updatedAt: "desc" }, { name: "asc" }], skip, take: LIMIT }),
      prisma.skillResource.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pages: Math.max(1, Math.ceil(total / LIMIT)) });
  }

  const where = {
    ...active,
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
      { descriptionRu: { contains: query, mode: "insensitive" as const } },
      { owner: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.repositoryResource.findMany({ where, orderBy: [{ updatedAt: "desc" }, { name: "asc" }], skip, take: LIMIT }),
    prisma.repositoryResource.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pages: Math.max(1, Math.ceil(total / LIMIT)) });
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  const requestedType = request.nextUrl.searchParams.get("type");
  if (!isAdminLibraryType(requestedType)) return NextResponse.json({ error: "Неизвестный раздел" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const now = new Date();

  try {
    if (requestedType === "mcp") {
      const parsed = mcpAdminSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      const value = parsed.data;
      const item = await prisma.mcpResource.create({ data: {
        externalId: manualId(),
        slug: `${slugify(value.name)}-${randomUUID().slice(0, 8)}`,
        name: value.name,
        description: value.description,
        author: value.author || (value.name.includes("/") ? value.name.split("/")[0] : null),
        githubUrl: value.githubUrl || null,
        websiteUrl: value.websiteUrl || null,
        resourceType: value.resourceType,
        languageName: value.languageName || null,
        languageSlug: value.languageName ? slugify(value.languageName) : null,
        tags: value.tags,
        categoryNames: value.categoryNames,
        categorySlugs: value.categoryNames.map(slugify),
        rating: value.rating ?? null,
        stars: value.stars ?? null,
        isOfficial: value.isOfficial,
        location: value.location || null,
        features: [],
        requirements: [],
        license: value.license || null,
        source: "manual",
        sourceUrl: value.githubUrl || value.websiteUrl || "https://ai-bazar.ru",
        syncedAt: now,
        isActive: value.isActive,
      } });
      refreshLibrary();
      return NextResponse.json({ item }, { status: 201 });
    }

    if (requestedType === "prompts") {
      const parsed = promptAdminSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      const value = parsed.data;
      const item = await prisma.promptResource.create({ data: {
        externalId: manualId(),
        title: value.title,
        titleRu: value.titleRu || null,
        description: value.description || null,
        descriptionRu: value.descriptionRu || null,
        content: value.content,
        tags: value.tags,
        authorName: value.authorName || null,
        sourceKind: value.sourceKind,
        rating: value.rating,
        isPublic: value.isPublic,
        source: "manual",
        sourceUrl: "https://ai-bazar.ru",
        syncedAt: now,
        isActive: value.isActive,
      } });
      refreshLibrary();
      return NextResponse.json({ item }, { status: 201 });
    }

    if (requestedType === "skills") {
      const parsed = skillAdminSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      const value = parsed.data;
      const item = await prisma.skillResource.create({ data: {
        externalId: manualId(),
        name: value.name,
        description: value.description,
        descriptionRu: value.descriptionRu || null,
        author: value.author || null,
        repoUrl: value.repoUrl || null,
        stars: value.stars ?? null,
        sourceLanguage: value.sourceLanguage || null,
        installCommand: value.installCommand || null,
        compatibleAgents: value.compatibleAgents,
        category: value.category || null,
        isOfficial: value.isOfficial,
        tags: value.tags,
        source: "manual",
        sourceUrl: value.repoUrl || "https://ai-bazar.ru",
        syncedAt: now,
        isActive: value.isActive,
      } });
      refreshLibrary();
      return NextResponse.json({ item }, { status: 201 });
    }

    const parsed = repoAdminSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const value = parsed.data;
    const urlParts = new URL(value.url).pathname.split("/").filter(Boolean);
    const item = await prisma.repositoryResource.create({ data: {
      name: value.name,
      owner: value.owner || urlParts[0] || null,
      repositoryName: value.repositoryName || urlParts[1] || null,
      description: value.description,
      descriptionRu: value.descriptionRu || null,
      url: value.url,
      language: value.language || null,
      stars: value.stars ?? null,
      source: "manual",
      sourceUrl: value.url,
      syncedAt: now,
      lastSeenAt: now,
      isActive: value.isActive,
    } });
    refreshLibrary();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Admin library create error:", error);
    return NextResponse.json({ error: "Не удалось создать ресурс. Проверьте уникальность ссылок и названий." }, { status: 409 });
  }
}
