"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Search, ShieldCheck, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UserItem = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  providers: string[];
  documents: number;
  orders: number;
};

export function AdminUsersManager({ initialUsers, currentUserId }: { initialUsers: UserItem[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("ru-RU");
    return users.filter((user) => !value || `${user.name || ""} ${user.email || ""}`.toLocaleLowerCase("ru-RU").includes(value));
  }, [query, users]);

  async function changeRole(user: UserItem, role: "USER" | "ADMIN") {
    setSavingId(user.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось изменить роль");
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role } : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось изменить роль");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по имени или email" className="h-11 rounded-xl bg-white pl-10 dark:bg-zinc-900" />
      </div>
      {message ? <p className="mt-3 text-sm text-red-600" role="alert">{message}</p> : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="hidden grid-cols-[minmax(260px,1fr)_160px_120px_120px_180px] gap-4 border-b border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black/40 dark:border-white/10 dark:text-white/40 lg:grid">
          <span>Пользователь</span><span>Регистрация</span><span>Документы</span><span>Заказы</span><span>Роль</span>
        </div>
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {filtered.map((user) => (
            <div key={user.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(260px,1fr)_160px_120px_120px_180px] lg:items-center lg:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarImage src={user.image || undefined} /><AvatarFallback>{(user.name || user.email || "?")[0]?.toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0"><div className="flex items-center gap-2 truncate font-medium">{user.name || "Без имени"}{user.role === "ADMIN" ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : null}</div><div className="truncate text-xs text-black/45 dark:text-white/45">{user.email || "Email не указан"}</div><div className="mt-1 text-[10px] text-black/35 dark:text-white/35">{user.providers.length ? user.providers.join(", ") : "email"}</div></div>
              </div>
              <div className="text-sm"><span className="mr-2 text-xs text-black/40 lg:hidden">Регистрация:</span>{new Intl.DateTimeFormat("ru-RU").format(new Date(user.createdAt))}</div>
              <div className="text-sm"><span className="mr-2 text-xs text-black/40 lg:hidden">Документы:</span>{user.documents}</div>
              <div className="text-sm"><span className="mr-2 text-xs text-black/40 lg:hidden">Заказы:</span>{user.orders}</div>
              <div className="flex items-center gap-2">
                {savingId === user.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : user.role === "ADMIN" ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                <Select value={user.role} disabled={savingId === user.id || user.id === currentUserId} onValueChange={(value: "USER" | "ADMIN") => void changeRole(user, value)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USER">Пользователь</SelectItem><SelectItem value="ADMIN">Администратор</SelectItem></SelectContent></Select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
