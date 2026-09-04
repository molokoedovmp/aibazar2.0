"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, CreditCard, Search, Users } from "lucide-react";

import PopularToolsSection, { type FeaturedResponse } from "./PopularToolsSection";

const Spline = dynamic(() => import("@/app/components/home/SplineClient"), { ssr: false });

export function Landingsecond() {
  const [payload, setPayload] = useState<FeaturedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/library/featured", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load featured resources");
        return response.json() as Promise<FeaturedResponse>;
      })
      .then((result) => {
        if (result.success) setPayload(result);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setPayload(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-black dark:bg-black dark:text-white">
      <main className="flex-1">
        <meta name="yandex-verification" content="31f9fbf9bddca189" />

        <section className="relative overflow-hidden bg-[#0b0b0c] pt-16 text-white md:min-h-[680px]">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Декоративный фон для мобильной версии (робот на mobile скрыт) */}
          <div aria-hidden className="pointer-events-none absolute inset-0 md:hidden">
            {/* цветное свечение сверху */}
            <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(80%_100%_at_50%_-5%,rgba(125,104,255,0.28),transparent_70%)]" />
            {/* мягкие цветные пятна */}
            <div className="absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-sky-400/10 blur-[110px]" />
            <div className="absolute -right-16 top-28 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-[120px]" />
            {/* более выразительная сетка с плавным затуханием к краям */}
            <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_85%_65%_at_50%_0%,black_25%,transparent_80%)]" />
            {/* мягкая виньетка снизу для читаемости */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b0b0c] to-transparent" />
            {/* лёгкое свечение-линза над заголовком */}
            <div className="absolute inset-x-8 top-24 h-40 rounded-[50%] bg-white/[0.045] blur-3xl" />
          </div>

          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16 lg:px-10 lg:py-20">
            <div className="max-w-xl">
              <h1 className="text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[68px]">
                Найдите AI-инструмент под свою задачу
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/60 sm:text-lg">
                Нейросети, MCP-серверы, промпты, навыки и open-source проекты — с понятными описаниями, рейтингами и быстрым поиском.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/catalog"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-black shadow-[0_6px_20px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.25)] transition hover:border-zinc-400 hover:bg-zinc-200"
                >
                  <Search className="h-4 w-4" />
                  Найти инструмент
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
                >
                  <Users className="h-4 w-4" />
                  Сообщество
                </Link>
              </div>

              {payload?.counts?.tools ? (
                <p className="mt-6 text-xs text-white/40">
                  В каталоге уже {payload.counts.tools.toLocaleString("ru-RU")} AI-инструментов
                </p>
              ) : null}
            </div>

            <div className="relative mx-auto hidden h-[520px] w-full max-w-[680px] lg:block">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.08] blur-3xl" />
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <Spline scene="https://prod.spline.design/xasN6jN3w1ggRc6p/scene.splinecode" />
              </div>
            </div>
          </div>
        </section>

        <section
          id="payment-help"
          className="bg-[#f6f6f3] px-5 pt-6 dark:bg-[#0b0b0c] sm:px-8 sm:pt-8 lg:px-10"
        >
          <Link
            href="/calculator"
            className="group mx-auto grid w-full max-w-7xl gap-5 overflow-hidden rounded-3xl bg-black px-6 py-6 text-white transition hover:-translate-y-0.5 hover:shadow-xl dark:border dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-8"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
              <CreditCard className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                Нужна помощь с оплатой AI-сервиса?
              </span>
              <span className="mt-1 block max-w-2xl text-sm leading-6 text-white/60">
                Рассчитайте стоимость подписки в рублях и узнайте, как проходит оплата зарубежных сервисов.
              </span>
            </span>
            <span className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black">
              Открыть калькулятор
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </section>

        <PopularToolsSection payload={payload} loading={loading} />
      </main>
    </div>
  );
}
