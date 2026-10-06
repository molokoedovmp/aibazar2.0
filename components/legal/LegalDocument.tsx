import type { ReactNode } from "react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { LEGAL_UPDATED_AT } from "@/lib/legal";

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black dark:bg-black dark:text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-10 border-b border-black/10 pb-7 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
            Документы aiBazar
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-black/50 dark:text-white/50">
            Редакция от {LEGAL_UPDATED_AT}
          </p>
        </header>

        <article className="space-y-8 text-sm leading-7 text-black/70 dark:text-white/70 [&_a]:font-medium [&_a]:text-black [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-white [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-black dark:[&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-black dark:[&_strong]:text-white [&_ul]:space-y-2">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}

export function OperatorDetails() {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.025] p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/50 dark:text-white/50">
        Оператор / Исполнитель
      </p>
      <p><strong>ФИО: Молокоедов Михаил Павлович</strong></p>
      <p>Статус: плательщик налога на профессиональный доход (самозанятый)</p>
      <p>ИНН: 772310798620</p>
      <p>Адрес для корреспонденции: г. Москва, Новочеркасский бульвар, д. 47, кв. 113</p>
      <p>
        E-mail для обращений: <a href="mailto:molokoedovmp@gmail.com">molokoedovmp@gmail.com</a>
      </p>
    </div>
  );
}
