import type { Metadata } from "next";
import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import PricingCalculator from "@/components/PricingCalculator";
import { getUsdFx } from "@/lib/pricing";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Калькулятор стоимости подписки на AI-инструменты",
  description:
    "Рассчитайте ориентировочную стоимость зарубежной AI-подписки в рублях и перейдите к инструкции по оплате выбранного инструмента.",
  alternates: { canonical: "/calculator" },
  openGraph: {
    title: "Калькулятор стоимости AI-подписок",
    description: "Пересчитайте цену подписки на нейросеть или AI-инструмент из долларов в рубли.",
    url: "/calculator",
  },
};

export default async function CalculatorPage() {
  const fx = await getUsdFx();

  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f4f0] text-black dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />
      <main className="relative flex flex-1 items-center overflow-x-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 min-h-[calc(100dvh-8rem)] content-center lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-black/45 dark:text-zinc-400">
              Калькулятор цен
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-5xl lg:text-[54px]">
              Узнайте стоимость подписки в рублях
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-black/60 dark:text-zinc-400 sm:text-base sm:leading-7">
              Калькулятор нужен, чтобы заранее узнать ориентировочную стоимость
              зарубежной подписки в рублях. Введите цену тарифа в долларах — сумма
              пересчитается по актуальному курсу.
            </p>

            <div className="mt-7 border-t border-black/10 pt-6 dark:border-white/10">
              <h2 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                Если нужна помощь с оплатой
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 dark:text-zinc-400">
                Напишите мне в Telegram — я проверю выбранный сервис, уточню итоговую
                стоимость и помогу оплатить подписку на официальной странице.
              </p>

              <ol className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  ["1", "Выберите сервис", "Пришлите название, тариф и ссылку на оплату."],
                  ["2", "Получите расчёт", "Я проверю способ оплаты и сообщу сумму в рублях."],
                  ["3", "Получите доступ", "Помогу оплатить и проверить активацию подписки."],
                ].map(([number, title, description]) => (
                  <li key={number} className="min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-semibold text-white dark:bg-white dark:text-black">
                      {number}
                    </span>
                    <div className="mt-2 min-w-0">
                      <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-black/50 dark:text-zinc-500">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <Link
                href="/payment-instructions"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/15 bg-black px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/15 dark:bg-white dark:text-black"
              >
                Открыть инструкцию по оплате
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <PricingCalculator fx={fx} />
        </div>
      </main>
      <div className="mt-auto shrink-0 border-t border-black/10 dark:border-white/10">
        <Footer />
      </div>
    </div>
  );
}
