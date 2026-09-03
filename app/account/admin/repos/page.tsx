import { AdminLibraryManager } from "@/components/admin/AdminLibraryManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminReposPage() {
  await requireAdminPage();

  const where = { isActive: true };
  const [items, total] = await Promise.all([
    prisma.repositoryResource.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 30,
      select: {
        id: true,
        name: true,
        owner: true,
        repositoryName: true,
        description: true,
        descriptionRu: true,
        url: true,
        language: true,
        stars: true,
        coverImages: true,
        isActive: true,
      },
    }),
    prisma.repositoryResource.count({ where }),
  ]);

  return (
    <AdminShell title="Репозитории" description="Отдельное управление open-source репозиториями и их данными с GitHub.">
      <AdminLibraryManager type="repos" initialItems={items} initialTotal={total} />
    </AdminShell>
  );
}
