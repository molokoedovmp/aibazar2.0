import { AdminShell } from "@/components/admin/AdminShell";
import { AdminOrdersManager } from "@/components/admin/AdminOrdersManager";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminOrdersPage() {
  await requireAdminPage();
  const orders = await prisma.aiToolOrder.findMany({ orderBy: { createdAt: "desc" }, take: 250 });
  const userIds = [...new Set(orders.map((order) => order.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const emails = new Map(users.map((user) => [user.id, user.email || "Email не указан"]));
  const items = orders.map((order) => ({
    id: order.id,
    userEmail: emails.get(order.userId) || "Пользователь удалён",
    serviceName: order.serviceName || "AI-инструмент",
    amount: order.amount,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    contactInfo: order.contactInfo,
    paymentId: order.paymentId,
  }));

  return (
    <AdminShell title="Заказы" description="Следите за оплатами и обновляйте состояние заказов пользователей.">
      <AdminOrdersManager initialOrders={items} />
    </AdminShell>
  );
}
