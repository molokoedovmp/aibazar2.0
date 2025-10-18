import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppSidebar } from "@/components/app-sidebar";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import OrderReceiptDialog from "@/components/account/OrderReceiptDialog";
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
  BadgeCheck,
  Coins,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { fetchYookassaPayment, mapYookassaStatus } from "@/lib/payments";
import { sendOrderPaidEmails } from "@/lib/mailer";

interface ToolOrder {
  id: string;
  serviceId: string;
  serviceName: string | null;
  serviceCover: string | null;
  amount: number;
  status: string;
  createdAt: Date;
  details: string | null;
  paymentId: string | null;
  confirmationUrl: string | null;
  paidAt: Date | null;
  contactInfo: string | null;
}

interface CreditPurchase {
  id: string;
  amount: number;
  price: number;
  status: string;
  timestamp: Date;
}

interface CreditUsage {
  id: string;
  service: string;
  timestamp: Date;
  amount: number;
}

function formatCurrency(value: number, currency: string = "RUB") {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function formatShortDate(date: Date) {
  try {
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatTime(date: Date) {
  try {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

function formatStatus(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    completed: {
      label: "Завершено",
      color: "bg-emerald-100 text-emerald-700",
    },
    pending: {
      label: "В обработке",
      color: "bg-amber-100 text-amber-700",
    },
    failed: {
      label: "Ошибка",
      color: "bg-rose-100 text-rose-700",
    },
  };
  return map[status] ?? {
    label: status,
    color: "bg-slate-100 text-slate-600",
  };
}

function serviceLabel(service: string) {
  const map: Record<string, string> = {
    "ai-blog": "Генерация статей",
    "ai-search": "AI поиск",
    "ai-analysis": "Аналитика",
    "ai-tools": "AI инструменты",
  };
  return map[service] ?? service;
}

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  const [initialOrders, creditBalance, creditPurchases, creditUsage] = await Promise.all([
    prisma.aiToolOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        serviceId: true,
        serviceName: true,
        serviceCover: true,
        amount: true,
        status: true,
        createdAt: true,
        details: true,
        paymentId: true,
        confirmationUrl: true,
        paidAt: true,
        contactInfo: true,
      },
    }),
    prisma.userCredit.findFirst({
      where: { userId },
      select: {
        totalCredits: true,
        usedCredits: true,
        plan: true,
      },
    }),
    prisma.creditPurchase.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        amount: true,
        price: true,
        status: true,
        paymentId: true,
        timestamp: true,
      },
      take: 10,
    }),
    prisma.creditUsageHistory.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        service: true,
        timestamp: true,
        amount: true,
      },
      take: 12,
    }),
  ]);

  let orders: ToolOrder[] = initialOrders as ToolOrder[];
  let creditPurchasesList: any[] = creditPurchases as any[];

  const pendingWithPayments = orders.filter((order) => order.paymentId && order.status !== "completed" && order.status !== "failed");

  if (pendingWithPayments.length && process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
    await Promise.all(
      pendingWithPayments.map(async (order) => {
        const payment = await fetchYookassaPayment(order.paymentId!);
        if (!payment) return;
        const { appStatus, paid } = mapYookassaStatus(payment.status);
        const paidAt = paid ? new Date(payment.paid_at ?? Date.now()) : null;
        const isNewlyCompleted = (appStatus === "completed" && order.status !== "completed") || (paid && !order.paidAt);
        if (appStatus !== order.status || (paid && !order.paidAt)) {
          await prisma.aiToolOrder.update({
            where: { id: order.id },
            data: {
              status: appStatus,
              paidAt,
              confirmationUrl: payment?.confirmation?.confirmation_url ?? order.confirmationUrl,
            },
          });
          // Отправляем письма только при первом переходе в завершённый статус
          if (isNewlyCompleted) {
            try {
              let contact: any = {};
              try { contact = order.contactInfo ? JSON.parse(order.contactInfo) : {}; } catch {}
              await sendOrderPaidEmails({
                orderId: order.id,
                serviceName: order.serviceName || "AI инструмент",
                amountRub: order.amount,
                paidAt,
                paymentId: payment?.id ?? null,
                confirmationUrl: payment?.confirmation?.confirmation_url ?? order.confirmationUrl ?? undefined,
                userEmail: (contact?.email as string | undefined) || (session?.user?.email as string | undefined),
                userName: (contact?.name as string | undefined) || (session?.user?.name as string | undefined),
                contact: {
                  name: contact?.name ?? null,
                  email: contact?.email ?? null,
                  telegram: contact?.telegram ?? null,
                },
                comment: order.details,
              });
            } catch (e) {
              console.error("Failed to send order emails", e);
            }
          }
        }
      })
    );

    orders = (await prisma.aiToolOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        serviceId: true,
        serviceName: true,
        serviceCover: true,
        amount: true,
        status: true,
        createdAt: true,
        details: true,
        paymentId: true,
        confirmationUrl: true,
        paidAt: true,
        contactInfo: true,
      },
    })) as ToolOrder[];
  }

  // Соберём ссылки для продолжения оплаты по пополнениям кредитов (как у инструментов)
  const creditConfirmUrls: Record<string, string | undefined> = {};
  {
    const toContinue = (creditPurchasesList as any[]).filter((p) => p.status === "pending" && p.paymentId);
    if (toContinue.length && process.env.YOOKASSA_SHOP_ID && (process.env.YOOKASSA_SECRET_KEY || process.env.YOOKASSA_KEY)) {
      const results = await Promise.all(
        toContinue.map(async (p) => {
          try {
            const payment = await fetchYookassaPayment(p.paymentId);
            return [p.id, payment?.confirmation?.confirmation_url as string | undefined] as const;
          } catch {
            return [p.id, undefined] as const;
          }
        })
      );
      for (const [id, url] of results) creditConfirmUrls[id] = url;
    }
  }

  // Обновим покупки кредитов по статусу YooKassa и зачислим кредиты
  const pendingCreditPurchases = (creditPurchasesList as any[]).filter((p) => p.status === "pending" && p.paymentId);
  if (pendingCreditPurchases.length) {
    await Promise.all(
      pendingCreditPurchases.map(async (p) => {
        try {
          const payment = await fetchYookassaPayment(p.paymentId!);
          if (!payment) return;
          const { appStatus, paid } = mapYookassaStatus(payment.status);
          const paidYn = paid || Boolean((payment as any)?.paid);
          if (appStatus === "completed" || paidYn) {
            const addCredits = Number(payment?.metadata?.credits ?? p.amount ?? 0) || 0;
            const realPrice = Number(payment?.amount?.value ?? p.price) || p.price;
            const existing = await prisma.userCredit.findFirst({ where: { userId } });
            if (existing) {
              await prisma.$transaction([
                prisma.creditPurchase.update({ where: { id: p.id }, data: { status: "completed", price: realPrice } }),
                prisma.userCredit.update({ where: { id: existing.id }, data: { totalCredits: { increment: addCredits }, plan: "basic" } }),
              ]);
            } else {
              await prisma.$transaction([
                prisma.creditPurchase.update({ where: { id: p.id }, data: { status: "completed", price: realPrice } }),
                prisma.userCredit.create({ data: { userId, totalCredits: addCredits, usedCredits: 0, plan: "basic" } }),
              ]);
            }
          } else if (appStatus === "failed") {
            await prisma.creditPurchase.update({ where: { id: p.id }, data: { status: "failed" } });
          }
        } catch {}
      })
    );

    // Перезагрузим список пополнений после обновления
    const reloaded = await prisma.creditPurchase.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      select: { id: true, amount: true, price: true, status: true, paymentId: true, timestamp: true },
      take: 10,
    });
    creditPurchasesList = reloaded as any[];
  }

  const toolOrders = orders;
  const purchases: CreditPurchase[] = creditPurchasesList as any;
  const usage: CreditUsage[] = creditUsage;

  const completedOrders = toolOrders.filter((order) => order.status === "completed");
  const pendingOrders = toolOrders.filter((order) => order.status === "pending");
  const failedOrders = toolOrders.filter((order) => order.status === "failed");
  const totalSpent = completedOrders.reduce((sum, order) => sum + (order.amount ?? 0), 0);

  const completedCreditPurchases = purchases.filter((purchase) => purchase.status === "completed");
  const totalCreditsPurchased = completedCreditPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalMoneyOnCredits = completedCreditPurchases.reduce((sum, purchase) => sum + purchase.price, 0);
  const creditsUsedTotal = usage.reduce((sum, entry) => sum + entry.amount, 0);
  const creditsUsedThisMonth = usage
    .filter((entry) => {
      const diff = Date.now() - entry.timestamp.getTime();
      return diff <= 30 * 24 * 60 * 60 * 1000;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  const availableCredits = creditBalance
    ? Math.max(creditBalance.totalCredits - creditBalance.usedCredits, 0)
    : 0;

  const stats = [
    {
      title: "Покупки AI-инструментов",
      value: toolOrders.length,
      hint: `${completedOrders.length} завершено, ${pendingOrders.length} в обработке`,
      icon: ShoppingBag,
    },
    {
      title: "Потрачено на инструменты",
      value: completedOrders.length ? formatCurrency(totalSpent) : "—",
      hint: failedOrders.length ? `${failedOrders.length} не завершено` : "Все платежи успешны",
      icon: Receipt,
    },
    {
      title: "Доступные кредиты",
      value: availableCredits,
      hint: creditBalance ? `План: ${creditBalance.plan}` : "План не активирован",
      icon: Coins,
    },
    {
      title: "Кредитов израсходовано",
      value: creditsUsedThisMonth,
      hint: `Всего: ${creditsUsedTotal}`,
      icon: Zap,
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
                  <BreadcrumbPage>Мои покупки</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="hidden text-sm text-slate-500 md:block">
            {completedOrders.length > 0
              ? `Последняя покупка — ${formatShortDate(completedOrders[0].createdAt)}`
              : "Пока нет оформленных заказов"}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-10 px-6 py-10">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl">
              <div className="text-xs uppercase tracking-[0.35em] text-white/60">Billing overview</div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                Управляйте покупками AI-инструментов и кредитов в одном месте.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-white/75">
                Здесь отображаются оформленные заказы, транзакции по кредитам и история их использования. Пополняйте баланс, следите за расходами и возвращайтесь к сервисам, которые уже показали результат.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/catalog"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-900 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:text-black"
                >
                  Найти новые инструменты
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/account/documents"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Работать с документами
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-900">Сводка по счету</div>
              <div className="mt-6 space-y-4">
                {stats.map(({ title, value, hint, icon: Icon }) => (
                  <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
                      <p className="text-xs text-slate-500">{hint}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Всего кредитов куплено: {totalCreditsPurchased} • На сумму {formatCurrency(totalMoneyOnCredits)}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">История заказов AI-инструментов</h2>
              {toolOrders.length > 0 && (
                <span className="text-sm text-slate-500">Всего {toolOrders.length}</span>
              )}
            </div>
            {toolOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                Вы ещё не оформляли заказов. Подберите AI-сервис в каталоге и вернитесь сюда, чтобы отслеживать статус и историю платежей.
              </div>
            ) : (
              <div className="space-y-3">
                {toolOrders.slice(0, 6).map((order) => {
                  const statusInfo = formatStatus(order.status);
                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-start gap-4">
                          {order.serviceCover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={order.serviceCover}
                              alt={order.serviceName ?? "AI tool"}
                              className="h-14 w-14 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                              <BadgeCheck className="h-5 w-5" />
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={order.serviceId ? `/catalog/${order.serviceId}` : "#"} className="text-base font-semibold text-slate-900 hover:underline">
                                {order.serviceName ?? "AI сервис"}
                              </Link>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatShortDate(order.createdAt)} • {formatTime(order.createdAt)}
                            </div>
                            {order.details && (
                              <p className="text-xs text-slate-500 line-clamp-2">{order.details}</p>
                            )}
                            {order.status === "completed" && order.paidAt && (
                              <div className="text-xs text-slate-500">Оплачено {formatShortDate(order.paidAt)} • {formatTime(order.paidAt)}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-stretch gap-2 sm:items-end">
                          <div className="text-base font-semibold text-slate-900">
                            {formatCurrency(order.amount)}
                          </div>
                          {order.status === "pending" && order.confirmationUrl && (
                            <Button asChild variant="outline" size="sm" className="sm:w-auto justify-center">
                              <Link href={order.confirmationUrl} target="_blank" rel="noopener noreferrer">
                                Продолжить оплату
                              </Link>
                            </Button>
                          )}
                          <OrderReceiptDialog order={order}>
                            <Button variant="ghost" size="sm" className="justify-center sm:w-auto text-slate-600 hover:text-slate-900">
                              Чек
                            </Button>
                          </OrderReceiptDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,7fr),minmax(0,5fr)]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Пополнения кредитов</h2>
                {purchases.length > 0 && (
                  <span className="text-sm text-slate-500">Показаны последние {purchases.length}</span>
                )}
              </div>
              {purchases.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-500">
                  История пополнений пустая. Оформите первый пакет кредитов, чтобы использовать AI-поиск и генерацию статей.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {purchases.map((purchase) => {
                    const statusInfo = formatStatus(purchase.status);
                    return (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {purchase.amount} кредитов
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatShortDate(purchase.timestamp)} • {formatTime(purchase.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-semibold text-slate-900">{formatCurrency(purchase.price)}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {purchase.status === "pending" && creditConfirmUrls[purchase.id] && (
                            <Link href={creditConfirmUrls[purchase.id]!} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-900">
                              Оплатить
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Использование кредитов</h2>
                {usage.length > 0 && (
                  <span className="text-sm text-slate-500">Последние {usage.length} операций</span>
                )}
              </div>
              {usage.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-500">
                  Вы ещё не тратили кредиты. Попробуйте AI-поиск или генерацию статей, чтобы увидеть здесь статистику.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {usage.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{serviceLabel(entry.service)}</div>
                          <div className="text-xs text-slate-500">
                            {formatShortDate(entry.timestamp)} • {formatTime(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Loader2 className="h-4 w-4" />
                        -{entry.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {toolOrders.length > 6 && (
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Все заказы</h2>
                <span className="text-sm text-slate-500">Полный список покупок</span>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Сервис</th>
                      <th className="px-4 py-3 text-left font-medium">Дата</th>
                      <th className="px-4 py-3 text-left font-medium">Сумма</th>
                      <th className="px-4 py-3 text-left font-medium">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {toolOrders.map((order) => {
                      const statusInfo = formatStatus(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <Link href={order.serviceId ? `/catalog/${order.serviceId}` : "#"} className="hover:underline">
                              {order.serviceName ?? "AI сервис"}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {formatShortDate(order.createdAt)} • {formatTime(order.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(order.amount)}</td>
                          <td className="px-4 py-3 space-y-1">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {order.status === "pending" && order.confirmationUrl && (
                              <div>
                                <Link href={order.confirmationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-900">
                                  Оплатить
                                </Link>
                              </div>
                            )}
                            <OrderReceiptDialog order={order}>
                              <button type="button" className="text-xs text-slate-500 hover:text-slate-900 underline">
                                Чек
                              </button>
                            </OrderReceiptDialog>
                          </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
              </div>
            </section>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
