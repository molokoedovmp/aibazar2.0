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
  DropdownMenuSeparator,
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

import { Home, Search, Settings2, Sparkles, Trash2, Star, ChevronsDownUp, LogOut, ShoppingCart, Plus, Compass, Bot, File} from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import SettingsForm from "@/components/account/SettingsForm";

// Данные для навигации
const data = {
  navMain: [
    { title: "Избранное", url: "/account/favorites", icon: Star, badge: "10" },
    { title: "Документы", url: "/account/documents", icon: File, badge: "10" },
    { title: "Bazarius", url: "#", icon: Sparkles },
    { title: "Мои покупки", url: "/account/purchases", icon: ShoppingCart },
    { title: "Сообщество", url: "/blog", icon: Compass},
    { title: "ai инструменты", url: "/catalog", icon: Bot},

  ],
  navSecondary: [
    { title: "Корзина", url: "#", icon: Trash2 },
  ],
  documents: [] as { id: string; title: string }[],
};


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [docs, setDocs] = React.useState<{ id: string; title: string; parentDocument?: string | null }[]>([]);
  const [favDocs, setFavDocs] = React.useState<{ id: string; title: string }[]>([]);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<"summary"|"plan"|"account">("summary");
  const [analytics, setAnalytics] = React.useState<{
    docsCount: number;
    favToolsCount: number;
    favDocsCount: number;
    ordersCount: number;
    credit: { plan: string; total: number; used: number; remaining: number } | null;
    usageLast30: { total: number; byService: Record<string, number> };
    lastOrder?: { serviceName: string | null; createdAt: string; amount: number | null; status: string | null } | null;
    lastCreditPurchase?: { amount: number | null; price: number | null; timestamp: string } | null;
    lastCreditUsage?: { service: string | null; timestamp: string; amount: number | null } | null;
    recentDocuments?: Array<{ id: string; title: string; updatedAt: string; previewText: string | null; isPublished: boolean }>;
    favoriteTools?: Array<{ id: string; createdAt: string; itemId: string; aiTool: { id: string; name: string; coverImage: string | null; rating: number | null; url: string | null } | null }>;
    preferences?: {
      analyticsEnabled: boolean;
      publicProfile: boolean;
      newsEmails: boolean;
      productEmails: boolean;
      securityEmails: boolean;
      timezone: string | null;
      language: string | null;
    } | null;
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

    const handleDocUpdated = (e: any) => {
      const detail = e?.detail as { id?: string; title?: string; parentDocument?: string | null; action?: 'add' | 'remove' } | undefined;
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
    window.addEventListener("document-updated", handleDocUpdated as unknown as EventListener);
    const handleFavs = (e: any) => {
      const detail = e?.detail as { id?: string; title?: string; action?: 'add' | 'remove' } | undefined;
      if (!detail?.id) return;
      if (detail.action === 'add') {
        setFavDocs((prev) => (prev.some((d) => d.id === detail.id) ? prev : [{ id: detail.id!, title: detail.title || 'Документ' }, ...prev]));
      } else if (detail.action === 'remove') {
        setFavDocs((prev) => prev.filter((d) => d.id !== detail.id));
      }
    };
    window.addEventListener('favorites-updated', handleFavs as unknown as EventListener);
    return () => {
      active = false;
      window.removeEventListener("document-updated", handleDocUpdated as unknown as EventListener);
      window.removeEventListener('favorites-updated', handleFavs as unknown as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (!settingsOpen) return;
    fetch("/api/account/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((d) => setAnalytics(d))
      .catch(() => {});
  }, [settingsOpen]);

  const userName = session?.user?.name || "Гость";
  const userEmail = session?.user?.email || "Нет email";
  const userImage = session?.user?.image || "";

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="flex items-center justify-between p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="group flex items-center gap-3 rounded-xl px-3 py-2 bg-white border border-gray-200 shadow-sm hover:shadow-md transition outline-none text-gray-900">
            <Avatar className="h-9 w-9 ring-1 ring-gray-200">
              <AvatarImage src={userImage} alt={userName} />
              <AvatarFallback>{userName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium leading-4">{userName}</span>
              <span className="text-xs text-gray-500 leading-3">{userEmail}</span>
            </div>
            <ChevronsDownUp className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-600" />
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
                  onClick={() => setSettingsTab("summary")}
                  className={`w-full text-left rounded-xl border p-3 ${settingsTab==="summary"?"bg-gray-50 border-gray-300":"bg-white border-gray-200 hover:border-gray-300"}`}
                >
                  Сводка
                </button>
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
              {settingsTab === "summary" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xl font-semibold mb-3">Использование кредитов</div>
                    <div className="rounded-xl border border-gray-200 bg-white p-0 overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                        <div className="text-sm text-gray-800">{analytics?.credit?.plan ? `Текущий план: ${analytics.credit.plan}` : "Вы используете бесплатный план"}</div>
                        <Button variant="outline" className="rounded-md">Обновить тариф</Button>
                      </div>
                      <div className="p-4 space-y-3">
                        {(() => {
                          const rows = analytics?.credit
                            ? [
                                { label: "Доступно кредитов", used: analytics.credit.used, total: analytics.credit.total },
                                { label: "Осталось", used: analytics.credit.remaining, total: analytics.credit.total },
                                { label: "Использование за 30 дней", used: analytics.usageLast30.total, total: Math.max(analytics.usageLast30.total, 1) },
                              ]
                            : [
                                { label: "Сообщения за месяц", used: 0, total: 25 },
                                { label: "Сообщения за день", used: 0, total: 5 },
                                { label: "Кредиты интеграций", used: 0, total: 100 },
                              ];
                          return rows.map((row) => {
                            const pct = Math.min(100, Math.round((row.used / row.total) * 100));
                            return (
                              <div key={row.label}>
                                <div className="flex items-center justify-between text-sm">
                                  <div className="text-gray-800">{row.label}</div>
                                  <div className="text-gray-700">{row.used}/{row.total}</div>
                                </div>
                                <div className="mt-1 h-2 w-full rounded bg-gray-100">
                                  <div style={{ width: `${pct}%` }} className="h-2 rounded bg-gray-800"></div>
                                </div>
                                <div className="mt-1 text-xs text-gray-600">Использовано {pct}%</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-semibold mb-3">Быстрые действия</div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[{
                        href: "/account/documents",
                        title: "Документы",
                        desc: "Управляйте черновиками и публикациями",
                      },{
                        href: "/catalog",
                        title: "Каталог инструментов",
                        desc: "Найдите свежие AI-сервисы для команды",
                      },{
                        href: "/account/purchases",
                        title: "Покупки",
                        desc: "Посмотреть историю заказов и счетов",
                      }].map((action) => (
                        <Link
                          key={action.href}
                          href={action.href}
                          className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:bg-gray-50 transition"
                        >
                          <div className="text-sm font-medium text-gray-900">{action.title}</div>
                          <div className="mt-1 text-sm text-gray-600">{action.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-semibold mb-3">Аналитика аккаунта</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[{label:'Документы', value: analytics?.docsCount ?? 0}, {label:'Избранные инструменты', value: analytics?.favToolsCount ?? 0}, {label:'Избранные документы', value: analytics?.favDocsCount ?? 0}, {label:'Покупки', value: analytics?.ordersCount ?? 0}].map((it)=> (
                        <div key={it.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                          <div className="text-2xl font-semibold">{it.value}</div>
                          <div className="text-xs text-gray-600 mt-1">{it.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-semibold mb-3">Недавние документы</div>
                    <div className="rounded-xl border border-gray-200 bg-white">
                      {analytics?.recentDocuments && analytics.recentDocuments.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                          {analytics.recentDocuments.map((doc) => (
                            <li key={doc.id} className="px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <Link href={`/account/documents/${doc.id}`} className="text-sm font-medium text-gray-900 hover:underline truncate">
                                  {doc.title}
                                </Link>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {new Date(doc.updatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-gray-600 line-clamp-2">{doc.previewText || (doc.isPublished ? 'Опубликованная заметка' : 'Черновик без описания')}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-6 text-sm text-gray-500">Документов пока нет — начните с первого черновика.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-semibold mb-3">Избранные инструменты</div>
                    <div className="rounded-xl border border-gray-200 bg-white">
                      {analytics?.favoriteTools && analytics.favoriteTools.length > 0 ? (
                        <div className="grid gap-3 p-4 md:grid-cols-2">
                          {analytics.favoriteTools.map((fav) => {
                            const tool = fav.aiTool;
                            if (!tool) return null;
                            return (
                              <a
                                key={fav.id}
                                href={tool.url || `/catalog/${tool.id}`}
                                target={tool.url ? "_blank" : undefined}
                                rel={tool.url ? "noopener noreferrer" : undefined}
                                className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:border-gray-200 hover:bg-gray-50"
                              >
                                {tool.coverImage ? (
                                  <img src={tool.coverImage} alt={tool.name} className="h-10 w-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-100" />
                                )}
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-gray-900">{tool.name}</div>
                                  <div className="text-xs text-gray-500">{typeof tool.rating === 'number' ? `⭐ ${tool.rating.toFixed(1)}` : 'Без оценки'}</div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-sm text-gray-500">Добавьте инструменты в избранное, чтобы быстро возвращаться к ним.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-semibold mb-3">Активность аккаунта</div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Последняя покупка</div>
                        <div className="mt-2 text-sm text-gray-700">
                          {analytics?.lastOrder
                            ? `${analytics.lastOrder.serviceName ?? 'AI сервис'} • ${new Date(analytics.lastOrder.createdAt).toLocaleString('ru-RU')} • ${typeof analytics.lastOrder.amount === 'number' ? `$${analytics.lastOrder.amount.toFixed(2)}` : ''}`
                            : 'Заказов ещё не было'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Последнее пополнение кредитов</div>
                        <div className="mt-2 text-sm text-gray-700">
                          {analytics?.lastCreditPurchase
                            ? `${analytics.lastCreditPurchase.amount ?? 0} кредитов • ${new Date(analytics.lastCreditPurchase.timestamp).toLocaleString('ru-RU')} • ${typeof analytics.lastCreditPurchase.price === 'number' ? `$${analytics.lastCreditPurchase.price.toFixed(2)}` : ''}`
                            : 'Пополнения ещё не оформлялись'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Последнее использование кредитов</div>
                        <div className="mt-2 text-sm text-gray-700">
                          {analytics?.lastCreditUsage
                            ? `${analytics.lastCreditUsage.service ?? 'Сервис'} • ${new Date(analytics.lastCreditUsage.timestamp).toLocaleString('ru-RU')} • -${analytics.lastCreditUsage.amount ?? 0}`
                            : 'Расходов пока нет'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Блок "Профиль и предпочтения" удалён по требованию */}

                  <div>
                    <div className="text-xl font-semibold mb-3">Безопасность и уведомления</div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { title: 'Пароль и вход', desc: 'Меняйте пароль каждые 90 дней и включите 2FA.', href: '/auth/reset' },
                        { title: 'Уведомления', desc: 'Выбирайте события для писем и push-оповещений.', href: '/account/notifications' },
                        { title: 'Устройства и доступ', desc: 'Следите за сессиями и интеграциями.', href: '/account/security' },
                      ].map((card) => (
                        <a key={card.title} href={card.href} className="rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{card.title}</div>
                          <div className="mt-1 text-sm text-gray-600">{card.desc}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "plan" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-lg font-medium">Тариф и оплата</div>
                    <div className="mt-2 text-sm text-gray-600">Вы используете бесплатный план. Улучшите тариф, чтобы увеличить лимиты и открыть интеграции.</div>
                    <div className="mt-4">
                      <Button>Обновить</Button>
                    </div>
                  </div>
                </div>
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
                </div>
              )}
            </div>

          </div>
        </SheetContent>
      </Sheet>

      <SidebarHeader>
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={favDocs} documents={docs} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
