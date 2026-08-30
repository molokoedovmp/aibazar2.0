import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppSidebar } from "@/components/app-sidebar";
import SettingsForm from "@/components/account/SettingsForm";
import { authOptions } from "@/app/api/auth/auth-options";
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

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <header className="flex h-20 shrink-0 items-center border-b border-slate-200 bg-white/70 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-slate-700 hover:bg-slate-100" />
            <Separator orientation="vertical" className="h-8 border-slate-200" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Настройки аккаунта</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <h1 className="text-xl font-semibold text-slate-900">Аккаунт</h1>
            <p className="mt-2 text-sm text-slate-500">
              Измените имя и фотографию профиля.
            </p>
            <div className="mt-7">
              <SettingsForm
                initialName={session.user.name || ""}
                initialImage={session.user.image || ""}
                email={session.user.email || ""}
              />
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
