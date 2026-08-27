import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Check, Clock, HelpCircle, ShieldCheck } from "lucide-react";

import { authOptions } from "@/app/api/auth/auth-options";
import { ToolImage } from "@/app/components/ToolImage";
import { AppSidebar } from "@/components/app-sidebar";
import { CheckoutForm } from "@/components/payment/CheckoutForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";

type SearchParams = {
  toolId?: string;
  priceRub?: string;
  toolName?: string;
};

export default async function PaymentPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    redirect(`/auth/login?callbackUrl=/payment${query ? `?${query}` : ""}`);
  }

  if (!params.toolId) redirect("/catalog");

  const tool = await prisma.aiTool.findUnique({
    where: { id: params.toolId },
    include: { category: true },
  });
  if (!tool) redirect("/catalog");

  const requestedPrice = params.priceRub ? Number(params.priceRub) : Number.NaN;
  let priceRub = Number.isFinite(requestedPrice) && requestedPrice >= 0
    ? Math.round(requestedPrice)
    : null;

  if (priceRub === null) {
    if (typeof tool.startPrice === "number") {
      priceRub = calcRubPrice(tool.startPrice, { fx: await getUsdFx() });
    } else if (typeof tool.price === "number") {
      priceRub = Math.round(tool.price);
    }
  }

  priceRub ??= 0;

  const benefits = [
    {
      icon: ShieldCheck,
      title: "Безопасная оплата",
      description: "После оплаты вы получите чек и подтверждение заказа.",
    },
    {
      icon: Clock,
      title: "Быстрая активация",
      description: "Обычно доступ появляется в течение 15 минут.",
    },
    {
      icon: HelpCircle,
      title: "Помощь менеджера",
      description: "Если возникнет вопрос, мы поможем в Telegram.",
    },
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
                  <BreadcrumbPage>Оплата</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">Оформление заказа</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-black sm:text-3xl">Оплата AI-сервиса</h1>
              <p className="mt-1 text-sm text-black/45">Проверьте выбранный сервис и укажите контактные данные.</p>
            </div>
            <Link
              href={`/catalog/${tool.id}`}
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-black/50 transition hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Вернуться к инструменту
            </Link>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 sm:h-32 sm:w-44">
                    <ToolImage
                      src={tool.coverImage}
                      alt={tool.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-black/40">
                      {tool.category?.name && <span>{tool.category.name}</span>}
                      {typeof tool.rating === "number" && <span>Рейтинг {tool.rating.toFixed(1)}</span>}
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-black sm:text-2xl">{tool.name}</h2>
                    {tool.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/45">{tool.description}</p>
                    )}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
                        {priceRub.toLocaleString("ru-RU")} ₽
                      </span>
                      {typeof tool.startPrice === "number" && (
                        <span className="text-xs text-black/35">от ${tool.startPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="divide-y divide-black/10 rounded-2xl border border-black/10 bg-white px-4 shadow-sm sm:px-5">
                {benefits.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex gap-3 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-black">{title}</h3>
                      <p className="mt-1 text-xs leading-5 text-black/45 sm:text-sm">{description}</p>
                    </div>
                  </div>
                ))}
              </section>

              <Link
                href="https://t.me/aibazaru"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 text-sm shadow-sm transition hover:bg-black/[0.02] sm:p-5"
              >
                <span>
                  <strong className="block text-black">Нужна помощь с оплатой?</strong>
                  <span className="mt-1 block text-black/45">Напишите менеджеру в Telegram.</span>
                </span>
                <Check className="h-5 w-5 shrink-0 text-black/35" />
              </Link>
            </div>

            <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-6">
              <h2 className="text-lg font-bold text-black">Контактные данные</h2>
              <p className="mt-1 text-sm leading-6 text-black/45">
                На эти контакты придут подтверждение заказа и данные для доступа.
              </p>
              <div className="mt-5">
                <CheckoutForm
                  toolId={tool.id}
                  toolName={tool.name}
                  priceRub={priceRub}
                  userEmail={session.user.email}
                  userName={session.user.name}
                />
              </div>
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
