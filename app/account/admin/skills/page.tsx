import { AdminLibraryManager } from "@/components/admin/AdminLibraryManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminSkillsPage() {
  await requireAdminPage();

  const where = { isActive: true };
  const [items, total] = await Promise.all([
    prisma.skillResource.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 30,
      select: {
        id: true,
        name: true,
        description: true,
        descriptionRu: true,
        author: true,
        repoUrl: true,
        stars: true,
        sourceLanguage: true,
        installCommand: true,
        compatibleAgents: true,
        category: true,
        isOfficial: true,
        tags: true,
        isActive: true,
      },
    }),
    prisma.skillResource.count({ where }),
  ]);

  return (
    <AdminShell title="Навыки" description="Отдельное управление навыками AI-агентов и инструкциями по их установке.">
      <AdminLibraryManager type="skills" initialItems={items} initialTotal={total} />
    </AdminShell>
  );
}
