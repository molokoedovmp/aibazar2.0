import { NextResponse } from "next/server";

import { translateMarkdownToRussian } from "@/lib/bing-translator";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const activeTranslations = new Map<string, Promise<string>>();

export async function POST(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const mcp = await prisma.mcpResource.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      description: true,
      descriptionRu: true,
      longDescription: true,
      longDescriptionRu: true,
      documentation: true,
    },
  });

  if (!mcp) return NextResponse.json({ error: "MCP не найден" }, { status: 404 });
  if (mcp.longDescriptionRu) return NextResponse.json({ markdown: mcp.longDescriptionRu });

  const sourceMarkdown = mcp.longDescription || mcp.documentation || mcp.description;
  if (sourceMarkdown === mcp.description && mcp.descriptionRu) {
    return NextResponse.json({ markdown: mcp.descriptionRu });
  }

  let translation = activeTranslations.get(slug);
  if (!translation) {
    translation = translateMarkdownToRussian(sourceMarkdown)
      .then(async (longDescriptionRu) => {
        await prisma.mcpResource.update({
          where: { id: mcp.id },
          data: { longDescriptionRu },
        });
        return longDescriptionRu;
      })
      .finally(() => activeTranslations.delete(slug));
    activeTranslations.set(slug, translation);
  }

  try {
    return NextResponse.json({ markdown: await translation });
  } catch (error) {
    console.error(`MCP README translation failed for ${slug}:`, error);
    return NextResponse.json({ error: "Не удалось перевести описание" }, { status: 503 });
  }
}
