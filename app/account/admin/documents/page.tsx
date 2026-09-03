import { AdminDocumentsManager } from "@/components/admin/AdminDocumentsManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin";
import { getAdminDocuments } from "@/lib/admin-documents";

export default async function AdminDocumentsPage() {
  await requireAdminPage();
  const result = await getAdminDocuments({});

  return (
    <AdminShell
      title="Документы"
      description="Просматривайте документы всех пользователей и удаляйте ненужные материалы."
    >
      <AdminDocumentsManager
        initialItems={result.items}
        initialTotal={result.total}
        initialPages={result.pages}
      />
    </AdminShell>
  );
}
