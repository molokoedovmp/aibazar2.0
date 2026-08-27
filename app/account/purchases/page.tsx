import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowUpRight,
  Coins,
  CreditCard,
  FileText,
  Receipt,
  ShoppingBag,
  Zap,
} from "lucide-react";

import { authOptions } from "@/app/api/auth/auth-options";
import { ToolImage } from "@/app/components/ToolImage";
import OrderReceiptDialog from "@/components/account/OrderReceiptDialog";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { prisma } from "@/lib/db";
import { sendOrderPaidEmails } from "@/lib/mailer";
import { fetchYookassaPayment, mapYookassaStatus } from "@/lib/payments";

type ToolOrder = {
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
};

type CreditPurchase = {
  id: string;
  amount: number;
  price: number;
  status: string;
  paymentId: string | null;
  timestamp: Date;
};

type CreditUsage = {
  id: string;
  service: string;
  timestamp: Date;
  amount: number;
};

type OrderContact = {
  name?: string | null;
  email?: string | null;
  telegram?: string | null;
};

const orderSelect = {
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
} as const;

const creditPurchaseSelect = {
  id: true,
  amount: true,
  price: true,
  status: true,
  paymentId: true,
  timestamp: true,
} as const;

function parseContact(value: string | null): OrderContact {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed as OrderContact : {};
  } catch {
    return {};
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status: string) {
  const statuses: Record<string, { label: string; className: string }> = {
    completed: { label: "Завершено", className: "bg-emerald-50 text-emerald-700" },
    pending: { label: "Ожидает оплаты", className: "bg-amber-50 text-amber-700" },
    failed: { label: "Не завершено", className: "bg-red-50 text-red-700" },
  };
  return statuses[status] || { label: status, className: "bg-black/5 text-black/50" };
}

function serviceLabel(service: string) {
  const services: Record<string, string> = {
    "ai-blog": "Генерация статей",
    "ai-search": "AI-поиск",
    "ai-analysis": "Аналитика",
    "ai-tools": "AI-инструменты",
    "ai-compose": "AI Composer",
    "ai-compose-deepseek": "AI Composer",
  };
  return services[service] || service;
}

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;
  const [initialOrders, initialCreditBalance, initialCreditPurchases, creditUsage] = await Promise.all([
    prisma.aiToolOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: orderSelect,
    }),
    prisma.userCredit.findFirst({
      where: { userId },
      select: { totalCredits: true, usedCredits: true, plan: true },
    }),
    prisma.creditPurchase.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      select: creditPurchaseSelect,
      take: 10,
    }),
    prisma.creditUsageHistory.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      select: { id: true, service: true, timestamp: true, amount: true },
      take: 12,
    }),
  ]);

  let orders: ToolOrder[] = initialOrders;
  let purchases: CreditPurchase[] = initialCreditPurchases;
  let creditBalance = initialCreditBalance;

  const pendingOrders = orders.filter(
    (order) => order.paymentId && order.status !== "completed" && order.status !== "failed",
  );

  if (pendingOrders.length && process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
    await Promise.all(
      pendingOrders.map(async (order) => {
        if (!order.paymentId) return;
        const payment = await fetchYookassaPayment(order.paymentId);
        if (!payment) return;

        const { appStatus, paid } = mapYookassaStatus(payment.status);
        const paidAt = paid ? new Date(payment.paid_at ?? Date.now()) : null;
        const newlyCompleted = (appStatus === "completed" && order.status !== "completed") || (paid && !order.paidAt);

        if (appStatus === order.status && (!paid || order.paidAt)) return;

        await prisma.aiToolOrder.update({
          where: { id: order.id },
          data: {
            status: appStatus,
            paidAt,
            confirmationUrl: payment.confirmation?.confirmation_url ?? order.confirmationUrl,
          },
        });

        if (newlyCompleted) {
          try {
            const contact = parseContact(order.contactInfo);
            await sendOrderPaidEmails({
              orderId: order.id,
              serviceName: order.serviceName || "AI-инструмент",
              amountRub: order.amount,
              paidAt,
              paymentId: payment.id ?? null,
              confirmationUrl: payment.confirmation?.confirmation_url ?? order.confirmationUrl ?? undefined,
              userEmail: contact.email || session.user.email || undefined,
              userName: contact.name || session.user.name || undefined,
              contact: {
                name: contact.name ?? null,
                email: contact.email ?? null,
                telegram: contact.telegram ?? null,
              },
              comment: order.details,
            });
          } catch (error) {
            console.error("Failed to send order emails", error);
          }
        }
      }),
    );

    orders = await prisma.aiToolOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: orderSelect,
    });
  }

  const creditConfirmationUrls: Record<string, string | undefined> = {};
  const pendingCreditPurchases = purchases.filter(
    (purchase) => purchase.status === "pending" && purchase.paymentId,
  );

  if (pendingCreditPurchases.length && process.env.YOOKASSA_SHOP_ID && (process.env.YOOKASSA_SECRET_KEY || process.env.YOOKASSA_KEY)) {
    await Promise.all(
      pendingCreditPurchases.map(async (purchase) => {
        if (!purchase.paymentId) return;
        const payment = await fetchYookassaPayment(purchase.paymentId);
        if (!payment) return;

        creditConfirmationUrls[purchase.id] = payment.confirmation?.confirmation_url;
        const { appStatus, paid } = mapYookassaStatus(payment.status);
        const paymentIsComplete = appStatus === "completed" || paid || Boolean(payment.paid);

        if (paymentIsComplete) {
          const creditsToAdd = Number(payment.metadata?.credits ?? purchase.amount) || 0;
          const realPrice = Number(payment.amount?.value ?? purchase.price) || purchase.price;
          const existingCredit = await prisma.userCredit.findFirst({ where: { userId } });

          if (existingCredit) {
            await prisma.$transaction([
              prisma.creditPurchase.update({
                where: { id: purchase.id },
                data: { status: "completed", price: realPrice },
              }),
              prisma.userCredit.update({
                where: { id: existingCredit.id },
                data: { totalCredits: { increment: creditsToAdd }, plan: "basic" },
              }),
            ]);
          } else {
            await prisma.$transaction([
              prisma.creditPurchase.update({
                where: { id: purchase.id },
                data: { status: "completed", price: realPrice },
              }),
              prisma.userCredit.create({
                data: { userId, totalCredits: creditsToAdd, usedCredits: 0, plan: "basic" },
              }),
            ]);
          }
        } else if (appStatus === "failed") {
          await prisma.creditPurchase.update({
            where: { id: purchase.id },
            data: { status: "failed" },
          });
        }
      }),
    );

    [purchases, creditBalance] = await Promise.all([
      prisma.creditPurchase.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        select: creditPurchaseSelect,
        take: 10,
      }),
      prisma.userCredit.findFirst({
        where: { userId },
        select: { totalCredits: true, usedCredits: true, plan: true },
      }),
    ]);
  }

  const completedOrders = orders.filter((order) => order.status === "completed");
  const pendingOrderCount = orders.filter((order) => order.status === "pending").length;
  const totalSpent = completedOrders.reduce((sum, order) => sum + order.amount, 0);
  const usage: CreditUsage[] = creditUsage;
  const creditsUsed = usage.reduce((sum, entry) => sum + entry.amount, 0);
  const availableCredits = creditBalance
    ? Math.max(creditBalance.totalCredits - creditBalance.usedCredits, 0)
    : 0;

  const stats = [
    { label: "Заказы", value: orders.length, hint: `${completedOrders.length} завершено`, icon: ShoppingBag },
    { label: "Потрачено", value: completedOrders.length ? formatCurrency(totalSpent) : "—", hint: `${pendingOrderCount} ожидают`, icon: Receipt },
    { label: "Доступные кредиты", value: availableCredits, hint: creditBalance?.plan || "Нет тарифа", icon: Coins },
    { label: "Кредитов использовано", value: creditsUsed, hint: "За последние операции", icon: Zap },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f6f6f3]">
        <header className="flex h-16 shrink-0 items-center border-b border-black/10 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-black/60 hover:bg-black/5" />
            <Separator orientation="vertical" className="h-7" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Покупки и оплата</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <section className="flex flex-col justify-between gap-4 border-b border-black/10 pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">Личный кабинет</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-black sm:text-3xl">Покупки и оплата</h1>
              <p className="mt-2 text-sm text-black/45">Заказы, пополнения и история использования кредитов.</p>
            </div>
            <Link
              href="/catalog?type=tools"
              className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/80"
            >
              Выбрать AI-сервис
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(({ label, value, hint, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-black/45 sm:text-sm">{label}</span>
                  <Icon className="h-4 w-4 shrink-0 text-black/25" />
                </div>
                <div className="mt-3 text-xl font-bold tracking-tight text-black sm:text-2xl">{value}</div>
                <p className="mt-1 truncate text-[11px] text-black/35 sm:text-xs">{hint}</p>
              </div>
            ))}
          </section>

          <section className="mt-9">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-black sm:text-lg">Заказы AI-сервисов</h2>
              <span className="text-xs text-black/35">{orders.length}</span>
            </div>

            {orders.length ? (
              <div className="mt-3 space-y-3">
                {orders.map((order) => {
                  const status = formatStatus(order.status);
                  return (
                    <article key={order.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5">
                            <ToolImage
                              src={order.serviceCover}
                              alt={order.serviceName || "AI-сервис"}
                              className="h-full w-full object-cover"
                              fallbackTextClassName="px-1 text-[7px]"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={order.serviceId ? `/catalog/${order.serviceId}` : "/catalog"}
                                className="truncate text-sm font-bold text-black hover:underline sm:text-base"
                              >
                                {order.serviceName || "AI-сервис"}
                              </Link>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${status.className}`}>
                                {status.label}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-black/35">{formatDate(order.createdAt)}</p>
                            {order.details && <p className="mt-2 line-clamp-2 text-xs text-black/45">{order.details}</p>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                          <strong className="text-sm text-black sm:text-base">{formatCurrency(order.amount)}</strong>
                          <div className="flex items-center gap-2">
                            {order.status === "pending" && order.confirmationUrl && (
                              <Link
                                href={order.confirmationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
                              >
                                Оплатить
                              </Link>
                            )}
                            <OrderReceiptDialog order={order}>
                              <button type="button" className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-black/55 transition hover:bg-black/5 hover:text-black">
                                Чек
                              </button>
                            </OrderReceiptDialog>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-black/15 bg-white px-5 py-10 text-center">
                <p className="text-sm text-black/45">Вы пока не оформляли заказы.</p>
              </div>
            )}
          </section>

          <section className="mt-9 grid items-start gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-black">Пополнения кредитов</h2>
                <CreditCard className="h-4 w-4 text-black/25" />
              </div>
              {purchases.length ? (
                <div className="mt-4 divide-y divide-black/10">
                  {purchases.map((purchase) => {
                    const status = formatStatus(purchase.status);
                    const confirmationUrl = creditConfirmationUrls[purchase.id];
                    return (
                      <div key={purchase.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div>
                          <div className="text-sm font-semibold text-black">{purchase.amount} кредитов</div>
                          <div className="mt-1 text-[11px] text-black/35">{formatDate(purchase.timestamp)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-black">{formatCurrency(purchase.price)}</div>
                          <div className="mt-1 flex items-center justify-end gap-2">
                            <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${status.className}`}>{status.label}</span>
                            {purchase.status === "pending" && confirmationUrl && (
                              <Link href={confirmationUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-black underline">
                                Оплатить
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-5 text-sm text-black/40">История пополнений пока пуста.</p>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-black">Использование кредитов</h2>
                <FileText className="h-4 w-4 text-black/25" />
              </div>
              {usage.length ? (
                <div className="mt-4 divide-y divide-black/10">
                  {usage.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <div className="text-sm font-semibold text-black">{serviceLabel(entry.service)}</div>
                        <div className="mt-1 text-[11px] text-black/35">{formatDate(entry.timestamp)}</div>
                      </div>
                      <span className="rounded-lg bg-black/5 px-2.5 py-1.5 text-xs font-bold text-black/55">−{entry.amount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-black/40">Кредиты ещё не использовались.</p>
              )}
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
