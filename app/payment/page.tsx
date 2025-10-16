import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";
import { AppSidebar } from "@/components/app-sidebar";
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
import { CheckoutForm } from "@/components/payment/CheckoutForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Clock, HelpCircle } from "lucide-react";

interface SearchParams {
  toolId?: string;
  priceRub?: string;
  toolName?: string;
}

export default async function PaymentPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    redirect(`/auth/login?callbackUrl=/payment${query ? `?${query}` : ""}`);
  }

  const toolId = params?.toolId;
  if (!toolId) {
    redirect("/catalog");
  }

  const tool = await prisma.aiTool.findUnique({ where: { id: toolId }, include: { category: true } });
  if (!tool) {
    redirect("/catalog");
  }

  const requestedPrice = params?.priceRub ? Number(params.priceRub) : NaN;
  let priceRub: number | null = Number.isFinite(requestedPrice) && requestedPrice >= 0 ? Math.round(requestedPrice) : null;

  if (priceRub === null) {
    if (typeof tool.startPrice === "number") {
      const fx = await getUsdFx();
      priceRub = calcRubPrice(tool.startPrice, { fx });
    } else if (typeof tool.price === "number") {
      priceRub = Math.round(tool.price);
    }
  }

  if (priceRub === null) priceRub = 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
          <div className="flex flex-1 items-center gap-3">
            <SidebarTrigger className="text-slate-700 hover:bg-slate-100" />
            <Separator orientation="vertical" className="h-8 border-slate-200" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Оплата</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Link href={`/catalog/${tool.id}`} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Вернуться к инструменту
          </Link>
        </header>

        <div className="flex flex-1 flex-col gap-10 px-6 py-10">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <Image
                    src={tool.coverImage || "/placeholder-tool.png"}
                    alt={tool.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h1 className="text-2xl font-semibold text-slate-900">{tool.name}</h1>
                  {tool.description && (
                    <p className="text-sm text-slate-600 line-clamp-3">{tool.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    {tool.category?.name && <span>Категория: {tool.category.name}</span>}
                    {typeof tool.rating === "number" && <span>Рейтинг: {tool.rating.toFixed(1)}</span>}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="text-3xl font-semibold text-slate-900">{priceRub.toLocaleString("ru-RU")} ₽</div>
                    {typeof tool.startPrice === "number" && (
                      <div className="text-xs uppercase tracking-wide text-slate-500">≈ ${tool.startPrice}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Контактная информация</h2>
              <p className="mt-2 text-sm text-slate-500">
                Заполните форму ниже, чтобы менеджер мог отправить доступ к инструменту. Мы подтвердим оплату и пришлём инструкции на указанные контакты.
              </p>
              <div className="mt-6">
                <CheckoutForm
                  toolId={tool.id}
                  toolName={tool.name}
                  priceRub={priceRub}
                  userEmail={session.user.email}
                  userName={session.user.name}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Безопасность сделки</h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                После оплаты вы получаете чек и письмо с реквизитами. Если что-то пойдёт не так, мы вернём деньги.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <Clock className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Сроки активации</h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Доступ к инструменту обычно активируется в течение 15 минут после оплаты. В редких случаях до 24 часов.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900">
                <HelpCircle className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Нужна помощь?</h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Напишите в Telegram <Link href="https://t.me/aibazaru" className="text-slate-900 underline">@aibazaru</Link> или на почту support@ai-bazar.ru. Мы на связи 09:00–22:00 (МСК).
              </p>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
