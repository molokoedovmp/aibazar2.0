import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE_URL = "https://ai-bazar.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog/mcp`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/catalog/prompts`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/catalog/skills`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/catalog/repos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/calculator`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/payment-instructions`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [tools, mcpResources, prompts, skills, repositories, articles] = await Promise.all([
      prisma.aiTool.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.mcpResource.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.promptResource.findMany({
        where: { isActive: true, isPublic: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.skillResource.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.repositoryResource.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.document.findMany({
        where: { isPublished: true, isArchived: false },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return [
      ...staticPages,
      ...tools.map((tool) => ({
        url: `${SITE_URL}/catalog/${encodeURIComponent(tool.id)}`,
        lastModified: tool.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...mcpResources.map((mcp) => ({
        url: `${SITE_URL}/catalog/mcp/${encodeURIComponent(mcp.slug)}`,
        lastModified: mcp.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...prompts.map((prompt) => ({
        url: `${SITE_URL}/catalog/prompts/${encodeURIComponent(prompt.id)}`,
        lastModified: prompt.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...skills.map((skill) => ({
        url: `${SITE_URL}/catalog/skills/${encodeURIComponent(skill.id)}`,
        lastModified: skill.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...repositories.map((repository) => ({
        url: `${SITE_URL}/catalog/repos/${encodeURIComponent(repository.id)}`,
        lastModified: repository.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...articles.map((article) => ({
        url: `${SITE_URL}/blog/${encodeURIComponent(article.id)}`,
        lastModified: article.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticPages;
  }
}
