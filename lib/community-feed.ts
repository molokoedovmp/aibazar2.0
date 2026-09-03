import type { Prisma } from "@prisma/client";

import type {
  CommunityFeedCounts,
  CommunityFeedItem,
  CommunityFeedResponse,
  CommunityFeedType,
} from "@/lib/community-types";
import { prisma } from "@/lib/db";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

function cleanText(value: string | null | undefined, maxLength = 360) {
  if (!value) return "";
  const cleaned = value
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength).trimEnd()}…` : cleaned;
}

function textFromBlockNote(content: string | null) {
  if (!content) return "";
  try {
    const parsed: unknown = JSON.parse(content);
    const fragments: string[] = [];
    const visit = (value: unknown) => {
      if (typeof value === "string") return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      if (typeof record.text === "string") fragments.push(record.text);
      Object.entries(record).forEach(([key, child]) => {
        if (key !== "text") visit(child);
      });
    };
    visit(parsed);
    return cleanText(fragments.join(" "));
  } catch {
    return cleanText(content);
  }
}

function fallbackDescription(type: CommunityFeedItem["type"]) {
  const labels: Record<CommunityFeedItem["type"], string> = {
    articles: "Новая статья сообщества AI Bazar.",
    tools: "AI-инструмент для работы, творчества и повседневных задач.",
    mcp: "MCP-сервер для подключения AI-агентов к внешним инструментам и данным.",
    prompts: "Готовый промпт для работы с нейросетями.",
    skills: "Навык, расширяющий возможности AI-агентов.",
    repos: "Open-source репозиторий для разработки AI-проектов.",
  };
  return labels[type];
}

function searchFilter(query: string) {
  return query ? { contains: query, mode: "insensitive" as const } : undefined;
}

function interleaveFeed(items: CommunityFeedItem[]) {
  const types: CommunityFeedItem["type"][] = ["articles", "tools", "mcp", "prompts", "skills", "repos"];
  const queues = new Map(types.map((resourceType) => [
    resourceType,
    items.filter((item) => item.type === resourceType),
  ]));
  const order = types
    .filter((resourceType) => (queues.get(resourceType)?.length || 0) > 0)
    .sort((first, second) => {
      const firstDate = new Date(queues.get(first)?.[0]?.createdAt || 0).getTime();
      const secondDate = new Date(queues.get(second)?.[0]?.createdAt || 0).getTime();
      return secondDate - firstDate;
    });
  const result: CommunityFeedItem[] = [];
  let hasItems = true;

  while (hasItems) {
    hasItems = false;
    for (const resourceType of order) {
      const next = queues.get(resourceType)?.shift();
      if (!next) continue;
      result.push(next);
      hasItems = true;
    }
  }

  return result;
}

export async function getCommunityFeed({
  type = "all",
  query = "",
  page = 1,
  limit = DEFAULT_LIMIT,
}: {
  type?: CommunityFeedType;
  query?: string;
  page?: number;
  limit?: number;
}): Promise<CommunityFeedResponse> {
  const normalizedQuery = query.trim();
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, limit));
  const itemsNeeded = safePage * safeLimit + 1;
  const wants = (resourceType: CommunityFeedItem["type"]) => type === "all" || type === resourceType;

  const articleWhere: Prisma.DocumentWhereInput = {
    isPublished: true,
    isArchived: false,
    ...(normalizedQuery ? { OR: [
      { title: searchFilter(normalizedQuery) },
      { previewText: searchFilter(normalizedQuery) },
    ] } : {}),
  };
  const toolWhere: Prisma.AiToolWhereInput = {
    isActive: true,
    ...(normalizedQuery ? { OR: [
      { name: searchFilter(normalizedQuery) },
      { description: searchFilter(normalizedQuery) },
      { category: { name: searchFilter(normalizedQuery) } },
    ] } : {}),
  };
  const mcpWhere: Prisma.McpResourceWhereInput = {
    isActive: true,
    ...(normalizedQuery ? { OR: [
      { name: searchFilter(normalizedQuery) },
      { description: searchFilter(normalizedQuery) },
      { author: searchFilter(normalizedQuery) },
    ] } : {}),
  };
  const promptWhere: Prisma.PromptResourceWhereInput = {
    isActive: true,
    isPublic: true,
    ...(normalizedQuery ? { OR: [
      { title: searchFilter(normalizedQuery) },
      { titleRu: searchFilter(normalizedQuery) },
      { description: searchFilter(normalizedQuery) },
      { descriptionRu: searchFilter(normalizedQuery) },
    ] } : {}),
  };
  const skillWhere: Prisma.SkillResourceWhereInput = {
    isActive: true,
    ...(normalizedQuery ? { OR: [
      { name: searchFilter(normalizedQuery) },
      { description: searchFilter(normalizedQuery) },
      { descriptionRu: searchFilter(normalizedQuery) },
      { author: searchFilter(normalizedQuery) },
    ] } : {}),
  };
  const repoWhere: Prisma.RepositoryResourceWhereInput = {
    isActive: true,
    ...(normalizedQuery ? { OR: [
      { name: searchFilter(normalizedQuery) },
      { description: searchFilter(normalizedQuery) },
      { descriptionRu: searchFilter(normalizedQuery) },
      { owner: searchFilter(normalizedQuery) },
    ] } : {}),
  };

  const [articles, tools, mcp, prompts, skills, repos, countArticles, countTools, countMcp, countPrompts, countSkills, countRepos] = await Promise.all([
    wants("articles") ? prisma.document.findMany({
      where: articleWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: itemsNeeded,
      select: { id: true, title: true, previewText: true, content: true, coverImage: true, userId: true, views: true, readTime: true, createdAt: true },
    }) : Promise.resolve([]),
    wants("tools") ? prisma.aiTool.findMany({
      where: toolWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: itemsNeeded,
      select: { id: true, name: true, description: true, coverImage: true, rating: true, createdAt: true, category: { select: { name: true } } },
    }) : Promise.resolve([]),
    wants("mcp") ? prisma.mcpResource.findMany({
      where: mcpWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: itemsNeeded,
      select: { id: true, slug: true, name: true, description: true, author: true, categoryNames: true, tags: true, languageName: true, stars: true, rating: true, isOfficial: true, coverImages: true, createdAt: true },
    }) : Promise.resolve([]),
    wants("prompts") ? prisma.promptResource.findMany({
      where: promptWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: itemsNeeded,
      select: { id: true, title: true, titleRu: true, description: true, descriptionRu: true, content: true, coverImages: true, tags: true, authorName: true, sourceKind: true, rating: true, createdAt: true },
    }) : Promise.resolve([]),
    wants("skills") ? prisma.skillResource.findMany({
      where: skillWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: itemsNeeded,
      select: { id: true, name: true, description: true, descriptionRu: true, coverImages: true, author: true, category: true, tags: true, sourceLanguage: true, installCommand: true, compatibleAgents: true, stars: true, isOfficial: true, createdAt: true },
    }) : Promise.resolve([]),
    wants("repos") ? prisma.repositoryResource.findMany({
      where: repoWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: itemsNeeded,
      select: { id: true, name: true, description: true, descriptionRu: true, coverImages: true, owner: true, url: true, language: true, stars: true, createdAt: true },
    }) : Promise.resolve([]),
    prisma.document.count({ where: { isPublished: true, isArchived: false } }),
    prisma.aiTool.count({ where: { isActive: true } }),
    prisma.mcpResource.count({ where: { isActive: true } }),
    prisma.promptResource.count({ where: { isActive: true, isPublic: true } }),
    prisma.skillResource.count({ where: { isActive: true } }),
    prisma.repositoryResource.count({ where: { isActive: true } }),
  ]);

  const articleUserIds = [...new Set(articles.map((article) => article.userId))];
  const articleUsers = articleUserIds.length
    ? await prisma.user.findMany({ where: { id: { in: articleUserIds } }, select: { id: true, name: true, email: true } })
    : [];
  const articleAuthors = new Map(articleUsers.map((user) => [user.id, user.name || user.email?.split("@")[0] || "Автор"]));

  const chronologicalItems: CommunityFeedItem[] = [
    ...articles.map((article): CommunityFeedItem => ({
      id: article.id,
      type: "articles",
      title: article.title,
      description: cleanText(article.previewText) || textFromBlockNote(article.content) || fallbackDescription("articles"),
      href: `/blog/${article.id}`,
      createdAt: article.createdAt.toISOString(),
      coverImage: article.coverImage,
      coverImages: article.coverImage ? [article.coverImage] : [],
      author: articleAuthors.get(article.userId) || "Автор",
      category: "Статья",
      tags: [],
      views: article.views,
      readTime: article.readTime,
    })),
    ...tools.map((tool): CommunityFeedItem => ({
      id: tool.id,
      type: "tools",
      title: tool.name,
      description: cleanText(tool.description) || fallbackDescription("tools"),
      href: `/catalog/${tool.id}`,
      createdAt: tool.createdAt.toISOString(),
      coverImage: tool.coverImage,
      coverImages: tool.coverImage ? [tool.coverImage] : [],
      category: tool.category.name,
      tags: [tool.category.name],
      rating: tool.rating,
    })),
    ...mcp.map((item): CommunityFeedItem => ({
      id: item.id,
      type: "mcp",
      title: item.name,
      description: cleanText(item.description) || fallbackDescription("mcp"),
      href: `/catalog/mcp/${item.slug}`,
      createdAt: item.createdAt.toISOString(),
      author: item.author,
      coverImages: item.coverImages,
      category: item.categoryNames[0] || "MCP Server",
      tags: [item.languageName, ...item.tags, ...item.categoryNames].filter((value): value is string => Boolean(value)).slice(0, 3),
      rating: item.rating,
      stars: item.stars,
      isOfficial: item.isOfficial,
    })),
    ...prompts.map((item): CommunityFeedItem => ({
      id: item.id,
      type: "prompts",
      title: item.titleRu || item.title,
      description: cleanText(item.descriptionRu || item.description) || fallbackDescription("prompts"),
      href: `/catalog?type=prompts&q=${encodeURIComponent(item.titleRu || item.title)}`,
      createdAt: item.createdAt.toISOString(),
      author: item.authorName,
      coverImages: item.coverImages,
      category: item.sourceKind || "Промпт",
      tags: item.tags.slice(0, 3),
      rating: item.rating,
      detailContent: item.content,
    })),
    ...skills.map((item): CommunityFeedItem => ({
      id: item.id,
      type: "skills",
      title: item.name,
      description: cleanText(item.descriptionRu || item.description) || fallbackDescription("skills"),
      href: `/catalog?type=skills&q=${encodeURIComponent(item.name)}`,
      createdAt: item.createdAt.toISOString(),
      author: item.author,
      coverImages: item.coverImages,
      category: item.category || "Навык",
      tags: [item.sourceLanguage, ...item.compatibleAgents, ...item.tags].filter((value): value is string => Boolean(value)).slice(0, 3),
      stars: item.stars,
      isOfficial: item.isOfficial,
      detailContent: item.descriptionRu || item.description,
      installCommand: item.installCommand,
    })),
    ...repos.map((item): CommunityFeedItem => ({
      id: item.id,
      type: "repos",
      title: item.name,
      description: cleanText(item.descriptionRu || item.description) || fallbackDescription("repos"),
      href: `/catalog?type=repos&q=${encodeURIComponent(item.name)}`,
      createdAt: item.createdAt.toISOString(),
      author: item.owner,
      coverImages: item.coverImages,
      category: item.language || "Open source",
      tags: item.language ? [item.language] : [],
      stars: item.stars,
      detailContent: item.descriptionRu || item.description,
      externalUrl: item.url,
    })),
  ].sort((first, second) => {
    const byDate = new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    return byDate || `${second.type}:${second.id}`.localeCompare(`${first.type}:${first.id}`);
  });
  const feedItems = type === "all" ? interleaveFeed(chronologicalItems) : chronologicalItems;

  const counts: CommunityFeedCounts = {
    articles: countArticles,
    tools: countTools,
    mcp: countMcp,
    prompts: countPrompts,
    skills: countSkills,
    repos: countRepos,
  };
  const typeCount = type === "all" ? Object.values(counts).reduce((sum, count) => sum + count, 0) : counts[type];
  const queryTotal = normalizedQuery
    ? feedItems.length
    : typeCount;
  const offset = (safePage - 1) * safeLimit;
  const data = feedItems.slice(offset, offset + safeLimit);
  const hasMore = normalizedQuery
    ? feedItems.length > offset + safeLimit
    : offset + data.length < typeCount;

  return {
    success: true,
    data,
    counts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: queryTotal,
      totalPages: Math.max(1, Math.ceil(queryTotal / safeLimit)),
      hasMore,
    },
  };
}
