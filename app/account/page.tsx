import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CreditCard,
  FileText,
  Heart,
} from "lucide-react";

import { authOptions } from "@/app/api/auth/auth-options";
import CreateDocumentButton from "@/components/account/CreateDocumentButton";
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

type RecentDocument = {
  id: string;
  title: string;
  preview: string;
  updatedAt: Date;
  isPublished: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function shortenPreview(text: string, maxWords = 28) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const words = normalized.split(" ");
  return words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}…` : normalized;
}

function extractPreviewText(content?: string | null, fallback?: string | null) {
  if (content) {
    try {
      const parsed: unknown = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const text = parsed
          .filter(isRecord)
          .flatMap((block) => {
            const props = isRecord(block.props) ? block.props : null;
            if (typeof props?.text === "string") return [props.text];

            if (!Array.isArray(block.content)) return [];
            return block.content
              .filter(isRecord)
              .map((node) => (typeof node.text === "string" ? node.text : ""));
          })
          .filter(Boolean)
          .join(" ");

        if (text) return shortenPreview(text);
      }
    } catch {
      return shortenPreview(content);
    }
  }

  return fallback ? shortenPreview(fallback) : "";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function AccountHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;
  const recentDocumentsRaw = await prisma.document.findMany({
    where: { userId, isArchived: false },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      previewText: true,
      updatedAt: true,
      isPublished: true,
    },
    take: 4,
  });

  const recentDocuments: RecentDocument[] = recentDocumentsRaw.map((document) => ({
    id: document.id,
    title: document.title || "Без названия",
    preview: extractPreviewText(document.content, document.previewText),
    updatedAt: document.updatedAt,
    isPublished: document.isPublished,
  }));

  const actions = [
    {
      title: "Документы",
      description: "Создавайте тексты и продолжайте работу с черновиками.",
      href: "/account/documents",
      icon: FileText,
      iconClassName: "from-violet-300 via-violet-500 to-indigo-700 shadow-violet-500/25",
    },
    {
      title: "Избранное",
      description: "AI-инструменты, MCP, промпты, навыки и репозитории.",
      href: "/account/favorites",
      icon: Heart,
      iconClassName: "from-rose-300 via-pink-500 to-rose-700 shadow-rose-500/25",
    },
    {
      title: "Покупки и оплата",
      description: "История заказов и продолжение незавершённых оплат.",
      href: "/account/purchases",
      icon: CreditCard,
      iconClassName: "from-cyan-300 via-sky-500 to-blue-700 shadow-sky-500/25",
    },
  ];

  const firstName = session.user.name?.trim().split(/\s+/)[0];

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
                  <BreadcrumbPage>Личный кабинет</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <section className="flex flex-col justify-between gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">Личный кабинет</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-black sm:text-3xl">
                {firstName ? `Здравствуйте, ${firstName}` : "Здравствуйте"}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-black/50">
                Документы, сохранённые ресурсы и покупки собраны в одном месте.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CreateDocumentButton className="inline-flex h-10 items-center rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/80" />
              <Link
                href="/catalog"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-black transition hover:bg-black/5"
              >
                Открыть каталог
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="mt-9">
            <h2 className="text-base font-bold text-black sm:text-lg">Основные разделы</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {actions.map(({ title, description, href, icon: Icon, iconClassName }) => (
                <Link
                  key={title}
                  href={href}
                  className="group flex min-h-36 flex-col rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <div
                    className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-white shadow-md ring-1 ring-black/5 ${iconClassName}`}
                  >
                    <span className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />
                    <Icon className="relative z-10 h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-black sm:text-base">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-black/45 sm:text-sm">{description}</p>
                  <ArrowUpRight className="ml-auto mt-auto h-4 w-4 text-black/25 transition group-hover:text-black" />
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-9">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-black sm:text-lg">Последние документы</h2>
              <Link href="/account/documents" className="text-xs font-semibold text-black/50 hover:text-black">
                Все документы
              </Link>
            </div>

            {recentDocuments.length ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {recentDocuments.map((document) => (
                  <Link
                    key={document.id}
                    href={`/account/documents?doc=${document.id}`}
                    className="flex min-h-44 flex-col rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-black/35">
                      <span>{formatDate(document.updatedAt)}</span>
                      <span className={`rounded-full px-2 py-1 ${document.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/45"}`}>
                        {document.isPublished ? "Опубликован" : "Черновик"}
                      </span>
                    </div>
                    <h3 className="mt-4 line-clamp-2 text-sm font-bold text-black">{document.title}</h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-black/45">
                      {document.preview || "Продолжите работу, чтобы здесь появился текст документа."}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-black/15 bg-white px-5 py-10 text-center">
                <p className="text-sm text-black/45">У вас пока нет документов.</p>
              </div>
            )}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
