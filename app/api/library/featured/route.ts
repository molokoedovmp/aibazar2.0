import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [tools, mcp, prompts, skills, repos, toolCount, mcpCount, promptCount, skillCount, repoCount] =
      await Promise.all([
        prisma.aiTool.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            coverImage: true,
            rating: true,
            category: { select: { name: true } },
          },
          orderBy: [{ rating: "desc" }, { name: "asc" }],
          take: 5,
        }),
        prisma.mcpResource.findMany({
          where: { isActive: true },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            descriptionRu: true,
            rating: true,
            stars: true,
            languageName: true,
          },
          orderBy: [{ rating: "desc" }, { stars: "desc" }, { views: "desc" }, { name: "asc" }],
          take: 5,
        }),
        prisma.promptResource.findMany({
          where: { isActive: true, isPublic: true },
          select: {
            id: true,
            title: true,
            titleRu: true,
            description: true,
            descriptionRu: true,
            rating: true,
            sourceKind: true,
          },
          orderBy: [{ rating: "desc" }, { sourceCreatedAt: "desc" }, { title: "asc" }],
          take: 5,
        }),
        prisma.skillResource.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            descriptionRu: true,
            stars: true,
            category: true,
          },
          orderBy: [{ stars: "desc" }, { name: "asc" }],
          take: 5,
        }),
        prisma.repositoryResource.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            descriptionRu: true,
            stars: true,
            language: true,
          },
          orderBy: [{ stars: "desc" }, { name: "asc" }],
          take: 5,
        }),
        prisma.aiTool.count({ where: { isActive: true } }),
        prisma.mcpResource.count({ where: { isActive: true } }),
        prisma.promptResource.count({ where: { isActive: true, isPublic: true } }),
        prisma.skillResource.count({ where: { isActive: true } }),
        prisma.repositoryResource.count({ where: { isActive: true } }),
      ]);

    return NextResponse.json(
      {
        success: true,
        data: { tools, mcp, prompts, skills, repos },
        counts: {
          tools: toolCount,
          mcp: mcpCount,
          prompts: promptCount,
          skills: skillCount,
          repos: repoCount,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    console.error("Featured library API error:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось загрузить популярные ресурсы" },
      { status: 500 },
    );
  }
}
