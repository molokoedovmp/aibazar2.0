import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { FavoritesLibrary, type FavoriteResource } from "@/app/account/favorites/FavoritesLibrary";
import { authOptions } from "@/app/api/auth/auth-options";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { prisma } from "@/lib/db";

export default async function FavoritesToolsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [aiFavorites, libraryFavorites] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: session.user.id, itemType: "aiTools" },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        aiTool: {
          select: {
            id: true,
            name: true,
            description: true,
            coverImage: true,
            rating: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.libraryFavorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const idsByType = {
    mcp: libraryFavorites.filter((item) => item.itemType === "mcp").map((item) => item.itemId),
    prompts: libraryFavorites.filter((item) => item.itemType === "prompts").map((item) => item.itemId),
    skills: libraryFavorites.filter((item) => item.itemType === "skills").map((item) => item.itemId),
    repos: libraryFavorites.filter((item) => item.itemType === "repos").map((item) => item.itemId),
  };

  const [mcpItems, promptItems, skillItems, repoItems] = await Promise.all([
    prisma.mcpResource.findMany({ where: { id: { in: idsByType.mcp }, isActive: true } }),
    prisma.promptResource.findMany({ where: { id: { in: idsByType.prompts }, isActive: true, isPublic: true } }),
    prisma.skillResource.findMany({ where: { id: { in: idsByType.skills }, isActive: true } }),
    prisma.repositoryResource.findMany({ where: { id: { in: idsByType.repos }, isActive: true } }),
  ]);

  const createdAtByKey = new Map(
    libraryFavorites.map((item) => [`${item.itemType}:${item.itemId}`, item.createdAt]),
  );

  const resources: FavoriteResource[] = [
    ...aiFavorites.flatMap((favorite) =>
      favorite.aiTool
        ? [{
            id: favorite.aiTool.id,
            itemType: "aiTools" as const,
            name: favorite.aiTool.name,
            description: favorite.aiTool.description || "AI-инструмент из вашей библиотеки.",
            coverImage: favorite.aiTool.coverImage,
            meta: favorite.aiTool.category?.name || "AI-инструмент",
            rating: favorite.aiTool.rating,
            stars: null,
            href: `/catalog/${favorite.aiTool.id}`,
            createdAt: favorite.createdAt.toISOString(),
            content: null,
            externalUrl: null,
            installCommand: null,
            tags: [],
            author: null,
            language: null,
          }]
        : [],
    ),
    ...mcpItems.map((item) => ({
      id: item.id,
      itemType: "mcp" as const,
      name: item.name,
      description: item.descriptionRu || item.description,
      coverImage: null,
      meta: item.languageName || item.resourceType,
      rating: item.rating,
      stars: item.stars,
      href: `/catalog/mcp/${item.slug}`,
      createdAt: (createdAtByKey.get(`mcp:${item.id}`) || item.createdAt).toISOString(),
      content: null,
      externalUrl: item.githubUrl || item.websiteUrl,
      installCommand: null,
      tags: item.tags,
      author: item.author,
      language: item.languageName,
    })),
    ...promptItems.map((item) => ({
      id: item.id,
      itemType: "prompts" as const,
      name: item.titleRu || item.title,
      description: item.descriptionRu || item.description || "Готовый промпт из AI-библиотеки.",
      coverImage: null,
      meta: item.sourceKind || "Готовый промпт",
      rating: item.rating || null,
      stars: null,
      href: "/catalog?type=prompts",
      createdAt: (createdAtByKey.get(`prompts:${item.id}`) || item.createdAt).toISOString(),
      content: item.content,
      externalUrl: item.sourceUrl,
      installCommand: null,
      tags: item.tags,
      author: item.authorName,
      language: null,
    })),
    ...skillItems.map((item) => ({
      id: item.id,
      itemType: "skills" as const,
      name: item.name,
      description: item.descriptionRu || item.description,
      coverImage: null,
      meta: item.category || item.sourceLanguage || "Навык агента",
      rating: null,
      stars: item.stars,
      href: "/catalog?type=skills",
      createdAt: (createdAtByKey.get(`skills:${item.id}`) || item.createdAt).toISOString(),
      content: null,
      externalUrl: item.repoUrl || item.sourceUrl,
      installCommand: item.installCommand,
      tags: [...item.tags, ...item.compatibleAgents].slice(0, 8),
      author: item.author,
      language: item.sourceLanguage,
    })),
    ...repoItems.map((item) => ({
      id: item.id,
      itemType: "repos" as const,
      name: item.name,
      description: item.descriptionRu || item.description,
      coverImage: null,
      meta: item.language || item.owner || "Open source",
      rating: null,
      stars: item.stars,
      href: "/catalog?type=repos",
      createdAt: (createdAtByKey.get(`repos:${item.id}`) || item.createdAt).toISOString(),
      content: null,
      externalUrl: item.url,
      installCommand: null,
      tags: [],
      author: item.owner,
      language: item.language,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f6f6f3]">
        <header className="flex h-16 shrink-0 items-center border-b border-black/10 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-black/60 hover:bg-black/5" />
            <Separator orientation="vertical" className="h-7" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Избранное</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">Избранное</h1>
              <p className="mt-1 text-sm text-black/45">{resources.length} сохранённых ресурсов</p>
            </div>
            <Link href="/catalog" className="text-sm font-semibold text-black hover:underline">
              Открыть каталог
            </Link>
          </div>

          {resources.length ? (
            <FavoritesLibrary resources={resources} />
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white px-5 py-12 text-center">
              <p className="text-sm text-black/50">Добавляйте ресурсы в избранное, чтобы они появились здесь.</p>
              <Link
                href="/catalog"
                className="mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
              >
                Перейти в каталог
              </Link>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
