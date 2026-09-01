import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const RESOURCE_TYPES = ["tools", "mcp", "prompts", "skills", "repos"] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];
const SORT_OPTIONS = ["rating", "stars", "newest"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

type FilterOption = {
  value: string;
  label: string;
  count: number;
};

function isResourceType(value: string | null): value is ResourceType {
  return RESOURCE_TYPES.includes(value as ResourceType);
}

function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.includes(value as SortOption);
}

function defaultSort(type: ResourceType): SortOption {
  return type === "tools" || type === "prompts" ? "rating" : "stars";
}

function supportsSort(type: ResourceType, sort: SortOption) {
  if (sort === "newest") return true;
  if (sort === "rating") return type === "tools" || type === "mcp" || type === "prompts";
  return type === "mcp" || type === "skills" || type === "repos";
}

function pagination(request: NextRequest) {
  const rawPage = Number(request.nextUrl.searchParams.get("page"));
  const rawLimit = Number(request.nextUrl.searchParams.get("limit"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 48) : 24;
  return { page, limit, skip: (page - 1) * limit };
}

async function resourceCounts() {
  const [tools, mcp, prompts, skills, repos] = await Promise.all([
    prisma.aiTool.count({ where: { isActive: true } }),
    prisma.mcpResource.count({ where: { isActive: true } }),
    prisma.promptResource.count({ where: { isActive: true, isPublic: true } }),
    prisma.skillResource.count({ where: { isActive: true } }),
    prisma.repositoryResource.count({ where: { isActive: true } }),
  ]);

  return { tools, mcp, prompts, skills, repos };
}

function groupedFilters(values: Array<string | null | undefined>): FilterOption[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ru"));
}

export async function GET(request: NextRequest) {
  try {
    const requestedType = request.nextUrl.searchParams.get("type");
    const type: ResourceType = isResourceType(requestedType) ? requestedType : "tools";
    const requestedSort = request.nextUrl.searchParams.get("sort");
    const sort = isSortOption(requestedSort) && supportsSort(type, requestedSort)
      ? requestedSort
      : defaultSort(type);
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";
    const filter = request.nextUrl.searchParams.get("filter")?.trim() || "";
    const { page, limit, skip } = pagination(request);
    const countsPromise = resourceCounts();

    if (type === "tools") {
      const orderBy: Prisma.AiToolOrderByWithRelationInput[] = sort === "newest"
        ? [{ createdAt: "desc" }, { rating: { sort: "desc", nulls: "last" } }, { name: "asc" }]
        : [{ rating: { sort: "desc", nulls: "last" } }, { name: "asc" }];
      const where = {
        isActive: true,
        ...(filter ? { categoryId: filter } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { category: { name: { contains: query, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      };

      const [data, total, categories, counts] = await Promise.all([
        prisma.aiTool.findMany({
          where,
          include: { category: { select: { id: true, name: true, icon: true } } },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.aiTool.count({ where }),
        prisma.category.findMany({
          where: { aiTools: { some: { isActive: true } } },
          select: {
            id: true,
            name: true,
            _count: { select: { aiTools: { where: { isActive: true } } } },
          },
          orderBy: { name: "asc" },
        }),
        countsPromise,
      ]);

      const filters = categories.map((category) => ({
        value: category.id,
        label: category.name,
        count: category._count.aiTools,
      }));

      return NextResponse.json({
        success: true,
        type,
        data,
        counts,
        filters,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      });
    }

    if (type === "mcp") {
      const orderBy: Prisma.McpResourceOrderByWithRelationInput[] = sort === "newest"
        ? [{ createdAt: "desc" }, { stars: { sort: "desc", nulls: "last" } }, { name: "asc" }]
        : sort === "rating"
          ? [{ rating: { sort: "desc", nulls: "last" } }, { stars: { sort: "desc", nulls: "last" } }, { name: "asc" }]
          : [{ stars: { sort: "desc", nulls: "last" } }, { rating: { sort: "desc", nulls: "last" } }, { name: "asc" }];
      const where = {
        isActive: true,
        ...(filter ? { categorySlugs: { has: filter } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { author: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const [data, total, facets, counts] = await Promise.all([
        prisma.mcpResource.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            externalId: true,
            slug: true,
            name: true,
            description: true,
            author: true,
            githubUrl: true,
            websiteUrl: true,
            resourceType: true,
            languageName: true,
            languageIcon: true,
            tags: true,
            categoryNames: true,
            rating: true,
            stars: true,
            views: true,
            downloads: true,
            isOfficial: true,
            location: true,
          },
        }),
        prisma.mcpResource.count({ where }),
        prisma.mcpResource.findMany({
          where: { isActive: true },
          select: { categoryNames: true, categorySlugs: true },
        }),
        countsPromise,
      ]);

      const categoryCounts = new Map<string, { label: string; count: number }>();
      for (const item of facets) {
        item.categorySlugs.forEach((slug, index) => {
          const label = item.categoryNames[index] || slug;
          const current = categoryCounts.get(slug);
          categoryCounts.set(slug, { label, count: (current?.count || 0) + 1 });
        });
      }
      const filters = [...categoryCounts.entries()]
        .map(([value, item]) => ({ value, ...item }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ru"));

      return NextResponse.json({
        success: true,
        type,
        data,
        counts,
        filters,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      });
    }

    if (type === "prompts") {
      const orderBy: Prisma.PromptResourceOrderByWithRelationInput[] = sort === "newest"
        ? [{ createdAt: "desc" }, { rating: "desc" }, { title: "asc" }]
        : [{ rating: "desc" }, { sourceCreatedAt: { sort: "desc", nulls: "last" } }, { title: "asc" }];
      const where = {
        isActive: true,
        isPublic: true,
        ...(filter ? { sourceKind: filter } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { titleRu: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { descriptionRu: { contains: query, mode: "insensitive" as const } },
                { content: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const [data, total, facets, counts] = await Promise.all([
        prisma.promptResource.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.promptResource.count({ where }),
        prisma.promptResource.findMany({
          where: { isActive: true, isPublic: true },
          select: { sourceKind: true },
        }),
        countsPromise,
      ]);

      const filters = groupedFilters(facets.map((item) => item.sourceKind));
      return NextResponse.json({
        success: true,
        type,
        data,
        counts,
        filters,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      });
    }

    if (type === "skills") {
      const orderBy: Prisma.SkillResourceOrderByWithRelationInput[] = sort === "newest"
        ? [{ createdAt: "desc" }, { stars: { sort: "desc", nulls: "last" } }, { name: "asc" }]
        : [{ stars: { sort: "desc", nulls: "last" } }, { name: "asc" }];
      const where = {
        isActive: true,
        ...(filter ? { category: filter } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { descriptionRu: { contains: query, mode: "insensitive" as const } },
                { author: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const [data, total, facets, counts] = await Promise.all([
        prisma.skillResource.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.skillResource.count({ where }),
        prisma.skillResource.findMany({ where: { isActive: true }, select: { category: true } }),
        countsPromise,
      ]);

      const filters = groupedFilters(facets.map((item) => item.category));
      return NextResponse.json({
        success: true,
        type,
        data,
        counts,
        filters,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      });
    }

    const orderBy: Prisma.RepositoryResourceOrderByWithRelationInput[] = sort === "newest"
      ? [{ createdAt: "desc" }, { stars: { sort: "desc", nulls: "last" } }, { name: "asc" }]
      : [{ stars: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    const where = {
      isActive: true,
      ...(filter ? { language: filter } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
              { descriptionRu: { contains: query, mode: "insensitive" as const } },
              { owner: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total, facets, counts] = await Promise.all([
      prisma.repositoryResource.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.repositoryResource.count({ where }),
      prisma.repositoryResource.findMany({ where: { isActive: true }, select: { language: true } }),
      countsPromise,
    ]);

    const filters = groupedFilters(facets.map((item) => item.language));
    return NextResponse.json({
      success: true,
      type,
      data,
      counts,
      filters,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("Library API error:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось загрузить AI-библиотеку" },
      { status: 500 },
    );
  }
}
