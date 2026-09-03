"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Order = {
  id: string;
  userEmail: string;
  serviceName: string;
  amount: number;
  status: string;
  createdAt: string;
  contactInfo: string;
  paymentId: string | null;
};

const statuses = [
  ["pending", "Ожидает оплаты"],
  ["waiting_for_capture", "Ожидает подтверждения"],
  ["paid", "Оплачен"],
  ["succeeded", "Выполнен"],
  ["canceled", "Отменён"],
  ["failed", "Ошибка"],
  ["refunded", "Возврат"],
] as const;

export function AdminOrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("ru-RU");
    return orders.filter((order) => !value || `${order.serviceName} ${order.userEmail} ${order.paymentId || ""}`.toLocaleLowerCase("ru-RU").includes(value));
  }, [orders, query]);

  async function changeStatus(order: Order, status: string) {
    setSavingId(order.id);
    const response = await fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status } : item));
    setSavingId(null);
  }

  return (
    <div>
      <div className="relative max-w-2xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 dark:text-white/35" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по сервису, email или ID платежа" className="h-11 rounded-xl bg-white pl-10 dark:bg-zinc-900" /></div>
      <div className="mt-4 grid gap-3">
        {filtered.map((order) => (
          <article key={order.id} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 lg:grid-cols-[1fr_180px_160px_220px] lg:items-center">
            <div className="min-w-0"><h2 className="truncate font-semibold">{order.serviceName}</h2><p className="mt-1 truncate text-xs text-black/45 dark:text-white/45">{order.userEmail} · {order.id}</p></div>
            <div><div className="font-semibold">{order.amount.toLocaleString("ru-RU")} ₽</div><div className="text-xs text-black/45 dark:text-white/45">{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</div></div>
            <div className="truncate text-xs text-black/45 dark:text-white/45" title={order.contactInfo}>{order.paymentId || "Без ID платежа"}</div>
            <Select value={order.status} disabled={savingId === order.id} onValueChange={(value) => void changeStatus(order, value)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          </article>
        ))}
        {!filtered.length ? <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm text-black/45 dark:border-white/15 dark:text-white/45">Заказы не найдены</div> : null}
      </div>
    </div>
  );
}
