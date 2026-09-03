import { AdminLibraryManager } from "@/components/admin/AdminLibraryManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminMcpPage() {
  await requireAdminPage();

  const where = { isActive: true };
  const [items, total] = await Promise.all([
    prisma.mcpResource.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 30,
      select: {
        id: true,
        name: true,
        description: true,
        author: true,
        githubUrl: true,
        websiteUrl: true,
        resourceType: true,
        languageName: true,
        tags: true,
        categoryNames: true,
        rating: true,
        stars: true,
        location: true,
        license: true,
        isOfficial: true,
        coverImages: true,
        isActive: true,
      },
    }),
    prisma.mcpResource.count({ where }),
  ]);

  return (
    <AdminShell title="MCP" description="Добавление, редактирование и публикация MCP-серверов каталога.">
      <AdminLibraryManager type="mcp" initialItems={items} initialTotal={total} />
    </AdminShell>
  );
}
