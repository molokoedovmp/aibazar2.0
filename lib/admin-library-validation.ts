import { z } from "zod";

const optionalUrl = z.union([z.string().url("Укажите корректную ссылку"), z.literal("")]).optional();
const optionalStars = z.union([z.number().int().min(0), z.null()]).optional();
const stringList = z.array(z.string().trim().min(1)).default([]);

export const libraryTypes = ["mcp", "prompts", "skills", "repos"] as const;
export type AdminLibraryType = (typeof libraryTypes)[number];

export const mcpAdminSchema = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().min(10).max(50_000),
  author: z.string().trim().max(120).optional(),
  githubUrl: optionalUrl,
  websiteUrl: optionalUrl,
  resourceType: z.string().trim().min(2).max(80).default("MCP Server"),
  languageName: z.string().trim().max(80).optional(),
  tags: stringList,
  categoryNames: stringList,
  rating: z.union([z.number().min(0).max(10), z.null()]).optional(),
  stars: optionalStars,
  location: z.string().trim().max(80).optional(),
  license: z.string().trim().max(100).optional(),
  isOfficial: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const promptAdminSchema = z.object({
  title: z.string().trim().min(2).max(180),
  titleRu: z.string().trim().max(180).optional(),
  description: z.string().trim().max(10_000).optional(),
  descriptionRu: z.string().trim().max(10_000).optional(),
  content: z.string().trim().min(10).max(100_000),
  tags: stringList,
  authorName: z.string().trim().max(120).optional(),
  sourceKind: z.string().trim().min(2).max(80).default("Авторский"),
  rating: z.number().int().min(0).max(10).default(0),
  isPublic: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const skillAdminSchema = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().min(10).max(30_000),
  descriptionRu: z.string().trim().max(30_000).optional(),
  author: z.string().trim().max(120).optional(),
  repoUrl: optionalUrl,
  stars: optionalStars,
  sourceLanguage: z.string().trim().max(80).optional(),
  installCommand: z.string().trim().max(10_000).optional(),
  compatibleAgents: stringList,
  category: z.string().trim().max(120).optional(),
  tags: stringList,
  isOfficial: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const repoAdminSchema = z.object({
  name: z.string().trim().min(2).max(180),
  owner: z.string().trim().max(120).optional(),
  repositoryName: z.string().trim().max(180).optional(),
  description: z.string().trim().min(10).max(30_000),
  descriptionRu: z.string().trim().max(30_000).optional(),
  url: z.string().url("Укажите корректную ссылку на репозиторий"),
  language: z.string().trim().max(80).optional(),
  stars: optionalStars,
  isActive: z.boolean().default(true),
});

export function isAdminLibraryType(value: string | null): value is AdminLibraryType {
  return libraryTypes.includes(value as AdminLibraryType);
}

export function emptyToNull<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value === "" ? null : value]),
  );
}
