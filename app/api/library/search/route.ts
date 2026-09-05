import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  type: "tools" | "mcp" | "prompts" | "skills" | "repos";
  title: string;
  description: string;
  href: string;
  coverImage: string | null;
  rating: number | null;
  stars: number | null;
};

function scoreResult(result: SearchResult, query: string) {
  const title = result.title.toLocaleLowerCase("ru");
  const description = result.description.toLocaleLowerCase("ru");
  const normalizedQuery = query.toLocaleLowerCase("ru");

  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;
  if (title.includes(normalizedQuery)) return 2;
  if (description.includes(normalizedQuery)) return 3;
  return 4;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) || "";

  if (query.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  const textFilter = { contains: query, mode: "insensitive" as const };

  try {
    const [tools, mcp, prompts, skills, repos] = await Promise.all([
      prisma.aiTool.findMany({
        where: {
          isActive: true,
          OR: [{ name: textFilter }, { description: textFilter }],
        },
        select: {
          id: true,
          name: true,
          description: true,
          coverImage: true,
          rating: true,
        },
        orderBy: [{ rating: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        take: 20,
      }),
      prisma.mcpResource.findMany({
        where: {
          isActive: true,
          OR: [{ name: textFilter }, { description: textFilter }, { descriptionRu: textFilter }],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          descriptionRu: true,
          coverImages: true,
          rating: true,
          stars: true,
        },
        orderBy: [{ stars: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        take: 20,
      }),
      prisma.promptResource.findMany({
        where: {
          isActive: true,
          isPublic: true,
          OR: [
            { title: textFilter },
            { titleRu: textFilter },
            { description: textFilter },
            { descriptionRu: textFilter },
          ],
        },
        select: {
          id: true,
          title: true,
          titleRu: true,
          description: true,
          descriptionRu: true,
          coverImages: true,
          rating: true,
        },
        orderBy: [{ rating: "desc" }, { title: "asc" }],
        take: 20,
      }),
      prisma.skillResource.findMany({
        where: {
          isActive: true,
          OR: [{ name: textFilter }, { description: textFilter }, { descriptionRu: textFilter }],
        },
        select: {
          id: true,
          name: true,
          description: true,
          descriptionRu: true,
          coverImages: true,
          stars: true,
        },
        orderBy: [{ stars: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        take: 20,
      }),
      prisma.repositoryResource.findMany({
        where: {
          isActive: true,
          OR: [{ name: textFilter }, { description: textFilter }, { descriptionRu: textFilter }],
        },
        select: {
          id: true,
          name: true,
          description: true,
          descriptionRu: true,
          coverImages: true,
          stars: true,
        },
        orderBy: [{ stars: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        take: 20,
      }),
    ]);

    const results: SearchResult[] = [
      ...tools.map((item) => ({
        id: item.id,
        type: "tools" as const,
        title: item.name,
        description: item.description,
        href: `/catalog/${item.id}`,
        coverImage: item.coverImage,
        rating: item.rating,
        stars: null,
      })),
      ...mcp.map((item) => ({
        id: item.id,
        type: "mcp" as const,
        title: item.name,
        description: item.descriptionRu || item.description,
        href: `/catalog/mcp/${item.slug}`,
        coverImage: item.coverImages[0] || null,
        rating: item.rating,
        stars: item.stars,
      })),
      ...prompts.map((item) => ({
        id: item.id,
        type: "prompts" as const,
        title: item.titleRu || item.title,
        description: item.descriptionRu || item.description || "Готовый промпт",
        href: `/catalog?type=prompts&q=${encodeURIComponent(item.titleRu || item.title)}`,
        coverImage: item.coverImages[0] || null,
        rating: item.rating || null,
        stars: null,
      })),
      ...skills.map((item) => ({
        id: item.id,
        type: "skills" as const,
        title: item.name,
        description: item.descriptionRu || item.description,
        href: `/catalog?type=skills&q=${encodeURIComponent(item.name)}`,
        coverImage: item.coverImages[0] || null,
        rating: null,
        stars: item.stars,
      })),
      ...repos.map((item) => ({
        id: item.id,
        type: "repos" as const,
        title: item.name,
        description: item.descriptionRu || item.description,
        href: `/catalog?type=repos&q=${encodeURIComponent(item.name)}`,
        coverImage: item.coverImages[0] || null,
        rating: null,
        stars: item.stars,
      })),
    ]
      .sort((a, b) => {
        const relevance = scoreResult(a, query) - scoreResult(b, query);
        if (relevance !== 0) return relevance;
        const metricA = a.rating || a.stars || 0;
        const metricB = b.rating || b.stars || 0;
        return metricB - metricA;
      })
      .slice(0, 10);

    return NextResponse.json(
      { success: true, data: results },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Homepage library search error:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось выполнить поиск" },
      { status: 500 },
    );
  }
}
