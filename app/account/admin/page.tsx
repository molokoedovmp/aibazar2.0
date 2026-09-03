import Link from "next/link";
import { ArrowUpRight, BookOpenText, Bot, CircleDollarSign, FileText, Github, Sparkles, Users } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  await requireAdminPage();

  const [users, tools, activeTools, orders, pendingOrders, documents, mcp, prompts, skills, repos] = await Promise.all([
    prisma.user.count(),
    prisma.aiTool.count(),
    prisma.aiTool.count({ where: { isActive: true } }),
    prisma.aiToolOrder.count(),
    prisma.aiToolOrder.count({ where: { status: { in: ["pending", "waiting_for_capture"] } } }),
    prisma.document.count(),
    prisma.mcpResource.count(),
    prisma.promptResource.count(),
    prisma.skillResource.count(),
    prisma.repositoryResource.count(),
  ]);

  const stats = [
    { label: "Пользователи", value: users, note: "зарегистрировано", icon: Users, href: "/account/admin/users" },
    { label: "AI-инструменты", value: tools, note: `${activeTools} опубликовано`, icon: Bot, href: "/account/admin/tools" },
    { label: "Заказы", value: orders, note: `${pendingOrders} требуют внимания`, icon: CircleDollarSign, href: "/account/admin/orders" },
    { label: "Документы", value: documents, note: "в базе сайта", icon: FileText, href: "/account/admin/documents" },
  ];

  const librarySections = [
    { label: "MCP", value: mcp, description: "MCP-серверы", icon: Bot, href: "/account/admin/mcp" },
    { label: "Промпты", value: prompts, description: "готовые запросы", icon: BookOpenText, href: "/account/admin/prompts" },
    { label: "Навыки", value: skills, description: "навыки агентов", icon: Sparkles, href: "/account/admin/skills" },
    { label: "Репозитории", value: repos, description: "проекты GitHub", icon: Github, href: "/account/admin/repos" },
  ];

  return (
    <AdminShell title="Панель управления" description="Главные показатели и быстрый доступ к управлению сайтом.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, href }) => (
          <Link key={label} href={href} className="group rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black"><Icon className="h-5 w-5" /></span>
              <ArrowUpRight className="h-4 w-4 text-black/35 transition group-hover:text-black dark:text-white/35 dark:group-hover:text-white" />
            </div>
            <div className="mt-7 text-3xl font-semibold tracking-tight">{value.toLocaleString("ru-RU")}</div>
            <div className="mt-1 font-medium">{label}</div>
            <div className="mt-1 text-xs text-black/45 dark:text-white/45">{note}</div>
          </Link>
        ))}
      </div>

      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-xl font-semibold">Разделы AI-библиотеки</h2>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">Каждый тип ресурса управляется на отдельной странице.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {librarySections.map(({ label, value, description, icon: Icon, href }) => (
            <Link key={href} href={href} className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 transition hover:border-black/30 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/30">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold">{label}<ArrowUpRight className="h-3.5 w-3.5 opacity-35 transition group-hover:opacity-100" /></span>
                <span className="mt-0.5 block text-xs text-black/45 dark:text-white/45">{value.toLocaleString("ru-RU")} · {description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 rounded-2xl border border-black/10 bg-black p-6 text-white dark:border-white/10">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">Быстрое действие</div>
          <h2 className="mt-2 text-2xl font-semibold">Добавьте новый AI-инструмент</h2>
          <p className="mt-2 text-sm text-white/60">Заполните карточку, выберите категорию, загрузите обложку и сразу опубликуйте инструмент в каталоге.</p>
          <Link href="/account/admin/tools?create=1" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
            Добавить инструмент <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
