"use client";

import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NavFavorites } from "@/components/nav-favorites";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { Settings2, Star, ChevronsDownUp, LogOut, ShoppingCart, Compass, Bot, File, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SettingsForm from "@/components/account/SettingsForm";
import { ThemeToggle } from "@/components/theme-toggle";

// Данные для навигации
const data = {
  navMain: [
    {
      title: "Избранное",
      url: "/account/favorites",
      icon: Star,
      iconClassName: "from-rose-300 via-pink-500 to-rose-700 shadow-rose-500/25",
    },
    {
      title: "Документы",
      url: "/account/documents",
      icon: File,
      iconClassName: "from-violet-300 via-violet-500 to-indigo-700 shadow-violet-500/25",
    },
    {
      title: "Мои покупки",
      url: "/account/purchases",
      icon: ShoppingCart,
      iconClassName: "from-cyan-300 via-sky-500 to-blue-700 shadow-sky-500/25",
    },
    {
      title: "Сообщество",
      url: "/blog",
      icon: Compass,
      iconClassName: "from-emerald-300 via-teal-500 to-cyan-700 shadow-teal-500/25",
    },
    {
      title: "AI-инструменты",
      url: "/catalog",
      icon: Bot,
      iconClassName: "from-amber-300 via-orange-400 to-orange-600 shadow-orange-500/25",
    },

  ],
  documents: [] as { id: string; title: string }[],
};

const adminNavItem = {
  title: "Администрирование",
  url: "/account/admin",
  icon: ShieldCheck,
  iconClassName: "from-slate-400 via-zinc-700 to-black shadow-zinc-500/25",
};


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [docs, setDocs] = React.useState<{ id: string; title: string; parentDocument?: string | null }[]>([]);
  const [favDocs, setFavDocs] = React.useState<{ id: string; title: string }[]>([]);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<"plan"|"account">("account");
  const [credit, setCredit] = React.useState<{
    plan: string;
    total: number;
    used: number;
    remaining: number;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d)) setDocs(d);
      })
      .catch(() => {});
    fetch("/api/documents/favorites")
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d)) setFavDocs(d);
      })
      .catch(() => {});

    const handleDocUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; title?: string; parentDocument?: string | null; action?: 'add' | 'remove' }>).detail;
      if (!detail?.id) return;
      if (detail.action === 'remove') {
        setDocs((prev) => prev.filter((d) => d.id !== detail.id));
        setFavDocs((prev) => prev.filter((d) => d.id !== detail.id));
        return;
      }
      let updated = false;
      setDocs((prev) => {
        const exists = prev.some((d) => d.id === detail.id);
        if (!exists) {
          updated = true;
          return [{ id: detail.id!, title: detail.title || 'Документ', parentDocument: detail.parentDocument ?? null }, ...prev];
        }
        return prev.map((it) => (it.id === detail.id ? { ...it, title: detail.title ?? it.title } : it));
      });
      if (updated && detail.parentDocument) {
        // no-op, kept for potential side effects
      }
      setFavDocs((prev) => prev.map((it) => (it.id === detail.id ? { ...it, title: detail.title ?? it.title } : it)));
    };
    window.addEventListener("document-updated", handleDocUpdated);
    const handleFavs = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; title?: string; action?: 'add' | 'remove' }>).detail;
      if (!detail?.id) return;
      if (detail.action === 'add') {
        setFavDocs((prev) => (prev.some((d) => d.id === detail.id) ? prev : [{ id: detail.id!, title: detail.title || 'Документ' }, ...prev]));
      } else if (detail.action === 'remove') {
        setFavDocs((prev) => prev.filter((d) => d.id !== detail.id));
      }
    };
    window.addEventListener('favorites-updated', handleFavs);
    return () => {
      active = false;
      window.removeEventListener("document-updated", handleDocUpdated);
      window.removeEventListener('favorites-updated', handleFavs);
    };
  }, []);

  React.useEffect(() => {
    if (!settingsOpen || settingsTab !== "plan") return;
    fetch("/api/credits")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((data) => setCredit(data))
      .catch(() => {});
  }, [settingsOpen, settingsTab]);

  const userName = session?.user?.name || "Гость";
  const userEmail = session?.user?.email || "Нет email";
  const userImage = session?.user?.image || "";

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition hover:bg-sidebar-accent hover:shadow-md dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
            <Avatar className="h-9 w-9 ring-1 ring-gray-200">
              <AvatarImage src={userImage} alt={userName} />
              <AvatarFallback>{userName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="truncate text-sm font-medium leading-4">{userName}</span>
              <span className="truncate text-xs leading-3 text-gray-500">{userEmail}</span>
            </div>
            <ChevronsDownUp className="ml-auto h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 bg-white border border-gray-200 shadow-xl rounded-2xl p-2">
            <DropdownMenuLabel className="px-2 pt-1 pb-2 text-xs font-medium text-gray-500">Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="p-0 rounded-xl focus:bg-transparent focus-visible:ring-0">
              <div className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-black">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">Настройки</div>
                  <div className="text-xs text-gray-500">Изменить имя и аватар</div>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="p-0 rounded-xl focus:bg-transparent focus-visible:ring-0">
              <div className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-black">
                  <LogOut className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">Выйти</div>
                  <div className="text-xs text-gray-500">Завершить сеанс</div>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="w-[95vw] sm:max-w-[980px] md:max-w-[1040px]">
          {/* a11y: Dialog requires a title */}
            <SheetHeader className="sr-only">
            <SheetTitle>Настройки</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-12 gap-6 h-full p-4">
            {/* Left nav */}
            <div className="col-span-12 md:col-span-3">
              <div className="text-lg font-semibold mb-3">Настройки</div>
              <div className="space-y-2">
                <button
                  onClick={() => setSettingsTab("plan")}
                  className={`w-full text-left rounded-xl border p-3 ${settingsTab==="plan"?"bg-gray-50 border-gray-300":"bg-white border-gray-200 hover:border-gray-300"}`}
                >
                  Тариф и оплата
                </button>
                <button
                  onClick={() => setSettingsTab("account")}
                  className={`w-full text-left rounded-xl border p-3 ${settingsTab==="account"?"bg-gray-50 border-gray-300":"bg-white border-gray-200 hover:border-gray-300"}`}
                >
                  Аккаунт
                </button>
              </div>
            </div>

            {/* Right content */}
            <div className="col-span-12 md:col-span-9 overflow-y-auto pr-1">
              {settingsTab === "plan" && (
                <PlanAndBillingSection credit={credit} />
              )}

              {settingsTab === "account" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-lg font-medium mb-3">Аккаунт</div>
                    <SettingsForm
                      initialName={session?.user?.name || ""}
                      initialImage={session?.user?.image || ""}
                      email={session?.user?.email || ""}
                    />
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
                    <div className="text-lg font-medium">Оформление</div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                      Выберите светлую или тёмную тему интерфейса.
                    </p>
                    <ThemeToggle
                      variant="menu"
                      className="mt-3 border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-zinc-950"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </SheetContent>
      </Sheet>

      <SidebarHeader>
        <NavMain items={session?.user?.role === "ADMIN" ? [...data.navMain, adminNavItem] : data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={favDocs} documents={docs} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function PlanAndBillingSection({
  credit,
}: {
  credit: { plan: string; total: number; used: number; remaining: number } | null;
}) {
  const [loading, setLoading] = React.useState<string | null>(null);
  const totalCredits = credit?.total ?? 0;
  const usedCredits = credit?.used ?? 0;
  const remainingCredits = credit?.remaining ?? 0;
  const usagePercent = totalCredits > 0
    ? Math.min(100, Math.round((usedCredits / totalCredits) * 100))
    : 0;
  const planName = credit?.plan && credit.plan !== "free" ? credit.plan : "Бесплатный";

  const packs = [
    { id: 'starter', title: 'Starter', credits: 50, priceRub: 299 },
    { id: 'pro', title: 'Pro', credits: 200, priceRub: 899 },
    { id: 'team', title: 'Team', credits: 500, priceRub: 1990 },
    { id: 'unit', title: 'Unit', credits: 1, priceRub: 1 }, // 1 ₽ = 1 кредит (фиксировано)
  ];

  const buy = async (packId: string, credits?: number) => {
    if (loading) return; setLoading(packId);
    try {
      const res = await fetch('/api/credits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packId === 'unit' ? { packId, credits } : { packId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Не удалось создать оплату');
      if (data?.confirmationUrl) window.location.href = data.confirmationUrl;
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Ошибка');
    } finally { setLoading(null); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-medium">Тариф и оплата</div>
            <div className="mt-1 text-sm text-gray-600">Текущий тариф: {planName}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-gray-900">{remainingCredits}</div>
            <div className="text-xs text-gray-500">кредитов доступно</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Использовано кредитов</span>
            <span>{usedCredits} из {totalCredits}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-black transition-[width]"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">Использовано {usagePercent}%</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {packs.map(p => (
          <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm uppercase tracking-wide text-gray-500">{p.title}</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{p.credits} кредитов</div>
            <div className="mt-1 text-gray-600">{p.priceRub.toLocaleString('ru-RU')} ₽</div>
            <Button className="mt-4 w-full" disabled={loading===p.id} onClick={() => buy(p.id)}>{loading===p.id?'Создаём оплату…':'Купить'}</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
