import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AdminNav } from "@/components/admin/AdminNav";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AdminShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-[#f6f6f3] dark:bg-zinc-950">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/10 bg-white/90 px-4 backdrop-blur dark:border-white/10 dark:bg-zinc-950/90 sm:px-6">
          <SidebarTrigger />
          <div className="h-5 w-px bg-black/10 dark:bg-white/10" />
          <Link href="/account" className="flex items-center gap-2 text-sm text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Личный кабинет
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">Администрирование</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-black/55 dark:text-white/55">{description}</p>
            </div>
            {actions}
          </div>

          <AdminNav />

          <div className="mt-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
