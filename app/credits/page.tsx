"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

const packs = [
  { id: "starter", title: "Starter", credits: 50, priceRub: 299 },
  { id: "pro", title: "Pro", credits: 200, priceRub: 899 },
  { id: "team", title: "Team", credits: 500, priceRub: 1990 },
];

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const buy = async (packId: string) => {
    if (loading) return;
    setLoading(packId);
    try {
      const res = await fetch('/api/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Не удалось создать оплату');
      if (data?.confirmationUrl) window.location.href = data.confirmationUrl;
    } catch (e) {
      alert((e as any)?.message || 'Ошибка');
    } finally {
      setLoading(null);
    }
  };

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
                  <BreadcrumbPage>Кредиты</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Link href="/account/purchases" className="text-sm text-slate-600 hover:underline">Мои покупки</Link>
        </header>

        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="mb-8 text-slate-600">Каждый запрос к ИИ расходует 1 кредит. Выберите пакет и оплатите через ЮKassa.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {packs.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm uppercase tracking-wide text-slate-500">{p.title}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{p.credits} кредитов</div>
                <div className="mt-1 text-slate-500">{p.priceRub.toLocaleString('ru-RU')} ₽</div>
                <Button className="mt-6 w-full" onClick={() => buy(p.id)} disabled={loading === p.id}>
                  {loading === p.id ? 'Создаём оплату…' : 'Купить'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
