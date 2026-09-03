import { AdminLibraryManager } from "@/components/admin/AdminLibraryManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminPromptsPage() {
  await requireAdminPage();

  const where = { isActive: true };
  const [items, total] = await Promise.all([
    prisma.promptResource.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      take: 30,
      select: {
        id: true,
        title: true,
        titleRu: true,
        description: true,
        descriptionRu: true,
        content: true,
        tags: true,
        authorName: true,
        sourceKind: true,
        rating: true,
        isPublic: true,
        isActive: true,
      },
    }),
    prisma.promptResource.count({ where }),
  ]);

  return (
    <AdminShell title="Промпты" description="Отдельное управление готовыми промптами, их текстом и публикацией.">
      <AdminLibraryManager type="prompts" initialItems={items} initialTotal={total} />
    </AdminShell>
  );
}
