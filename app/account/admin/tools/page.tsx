import { AdminShell } from "@/components/admin/AdminShell";
import { AdminToolsManager } from "@/components/admin/AdminToolsManager";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminToolsPage() {
  await requireAdminPage();

  const [tools, total, categories, documents] = await Promise.all([
    prisma.aiTool.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      where: { isActive: true },
      take: 30,
      include: { category: { select: { id: true, name: true, icon: true } } },
    }),
    prisma.aiTool.count({ where: { isActive: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, icon: true } }),
    prisma.document.findMany({ where: { isArchived: false }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return (
    <AdminShell title="AI-инструменты" description="Добавляйте и редактируйте карточки, управляйте публикацией, ценами, категориями и связанными статьями.">
      <AdminToolsManager initialTools={tools} initialCategories={categories} documents={documents} initialTotal={total} />
    </AdminShell>
  );
}
