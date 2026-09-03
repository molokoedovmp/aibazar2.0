import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  const admin = await requireAdminPage();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      accounts: { select: { provider: true } },
    },
  });

  const ids = users.map((user) => user.id);
  const [documentCounts, orderCounts] = await Promise.all([
    prisma.document.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: { _all: true } }),
    prisma.aiToolOrder.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: { _all: true } }),
  ]);
  const documents = new Map(documentCounts.map((item) => [item.userId, item._count._all]));
  const orders = new Map(orderCounts.map((item) => [item.userId, item._count._all]));

  const items = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    providers: user.accounts.map((account) => account.provider),
    accounts: undefined,
    documents: documents.get(user.id) || 0,
    orders: orders.get(user.id) || 0,
  }));

  return (
    <AdminShell title="Пользователи" description="Просматривайте зарегистрированные аккаунты и назначайте административные права.">
      <AdminUsersManager initialUsers={items} currentUserId={admin.user.id} />
    </AdminShell>
  );
}
