import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppSidebar } from "@/components/app-sidebar";
import SettingsForm from "@/components/account/SettingsForm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  BellRing,
  Coins,
  Fingerprint,
  History,
  KeyRound,
  Lock,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function formatDate(date?: Date | null) {
  if (!date) return "—";
  try {
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

function formatDateTime(date?: Date | null) {
  if (!date) return "—";
  try {
    return `${date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} • ${date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    const iso = new Date(date).toISOString();
    return `${iso.slice(0, 10)} • ${iso.slice(11, 16)}`;
  }
}

function formatCurrencyUSD(amount?: number | null) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "—";
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function planLabel(plan?: string | null) {
  switch (plan) {
    case "premium":
      return "Premium";
    case "basic":
      return "Basic";
    case "pro":
      return "Pro";
    default:
      return "Free";
  }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  const [documentsTotal, documentsPublished, favoriteDocuments, favoriteTools, creditInfo, lastOrder, lastCreditPurchase, lastCreditUsage] =
    await Promise.all([
      prisma.document.count({ where: { userId, isArchived: false } }),
      prisma.document.count({ where: { userId, isArchived: false, isPublished: true } }),
      prisma.document.count({ where: { userId, isArchived: false, isFavorite: true } }),
      prisma.favorite.count({ where: { userId, itemType: "aiTools" } }),
      prisma.userCredit.findFirst({
        where: { userId },
        select: {
          totalCredits: true,
          usedCredits: true,
          plan: true,
          updatedAt: true,
        },
      }),
      prisma.aiToolOrder.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          serviceName: true,
          createdAt: true,
          amount: true,
          status: true,
        },
      }),
      prisma.creditPurchase.findFirst({
        where: { userId, status: "completed" },
        orderBy: { timestamp: "desc" },
        select: {
          amount: true,
          price: true,
          timestamp: true,
        },
      }),
      prisma.creditUsageHistory.findFirst({
        where: { userId },
        orderBy: { timestamp: "desc" },
        select: {
          service: true,
          timestamp: true,
          amount: true,
        },
      }),
    ]);

  const availableCredits = creditInfo ? Math.max(creditInfo.totalCredits - creditInfo.usedCredits, 0) : 0;

  const stats: Array<{ title: string; value: number | string; hint: string }> = [
    {
      title: "Документов",
      value: documentsTotal,
      hint: `${documentsPublished} опубликовано`,
    },
    {
      title: "Избранные документы",
      value: favoriteDocuments,
      hint: "Быстрый доступ к важному",
    },
    {
      title: "Избранные инструменты",
      value: favoriteTools,
      hint: "Ваш персональный AI-стек",
    },
    {
      title: "Доступные кредиты",
      value: availableCredits,
      hint: `План: ${planLabel(creditInfo?.plan)}`,
    },
  ];

  const securityCards: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
    actions: Array<{ label: string; href: string }>;
  }> = [
    {
      title: "Пароль и вход",
      description: "Рекомендуем менять пароль каждые 90 дней и включить двухфакторную защиту.",
      icon: ShieldCheck,
      actions: [{ label: "Сменить пароль", href: "/auth/reset" }],
    },
    {
      title: "Уведомления",
      description: "Выбирайте события, о которых хотите получать письма и push-оповещения.",
      icon: BellRing,
      actions: [{ label: "Настроить уведомления", href: "/account/notifications" }],
    },
    {
      title: "Устройства и доступ",
      description: "Следите за активными сессиями и отключайте лишние интеграции.",
      icon: Fingerprint,
      actions: [{ label: "Управлять доступами", href: "/account/security" }],
    },
  ];

  const activityItems: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
  }> = [
    {
      label: "Последняя покупка",
      value: lastOrder
        ? `${lastOrder.serviceName ?? "AI сервис"} • ${formatDateTime(lastOrder.createdAt)} • ${formatCurrencyUSD(lastOrder.amount)}`
        : "Заказов ещё не было",
      icon: ShoppingBag,
    },
    {
      label: "Последнее пополнение кредитов",
      value: lastCreditPurchase
        ? `${lastCreditPurchase.amount} кредитов • ${formatDateTime(lastCreditPurchase.timestamp)} • ${formatCurrencyUSD(lastCreditPurchase.price)}`
        : "Пополнения ещё не оформлялись",
      icon: Coins,
    },
    {
      label: "Последнее использование кредитов",
      value: lastCreditUsage
        ? `${lastCreditUsage.service} • ${formatDateTime(lastCreditUsage.timestamp)} • -${lastCreditUsage.amount}`
        : "Расходов пока нет",
      icon: History,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/70 px-4 backdrop-blur">
          <div className="flex flex-1 items-center gap-3">
            <SidebarTrigger className="text-slate-700 hover:bg-slate-100" />
            <Separator orientation="vertical" className="h-8 border-slate-200" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Настройки</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="hidden text-sm text-slate-500 md:block">
            Профиль обновлён: {formatDate(creditInfo?.updatedAt)}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-10 px-6 py-10">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900">Профиль</h1>
                <span className="text-xs text-slate-500">Email: {session.user.email}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Обновите имя и аватар, чтобы команда и клиенты видели актуальную информацию.
              </p>
              <div className="mt-6">
                <SettingsForm
                  initialName={session.user.name || ""}
                  initialImage={session.user.image || ""}
                  email={session.user.email || ""}
                />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Сводка аккаунта</h2>
              <div className="mt-6 grid gap-4">
                {stats.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.title}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</div>
                    <p className="text-xs text-slate-500">{item.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {securityCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <div className="flex items-center gap-3 text-slate-900">
                      <Icon className="h-5 w-5" />
                      <h3 className="text-sm font-semibold">{card.title}</h3>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">{card.description}</p>
                  </div>
                  <div className="mt-6 space-y-2">
                {card.actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    {action.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ))}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <History className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Активность аккаунта</h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {activityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <Lock className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Политика конфиденциальности</h2>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Узнайте, как мы обрабатываем ваши данные и как можно экспортировать историю работы.
              </p>
              <Link href="/about/privacy" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                Читать политику
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <KeyRound className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Экспорт данных</h2>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Получите копию документов и активности, чтобы перенести данные в другие системы.
              </p>
              <Link href="/account/export" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                Запросить выгрузку
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
