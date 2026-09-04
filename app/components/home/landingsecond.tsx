"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Search, Users } from "lucide-react";

import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";
import PopularToolsSection, { type FeaturedResponse } from "./PopularToolsSection";

const Spline = dynamic(() => import("@/app/components/home/SplineClient"), { ssr: false });

export function Landingsecond() {
  const [payload, setPayload] = useState<FeaturedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const totalCatalogItems = payload
    ? Object.values(payload.counts).reduce((total, count) => total + count, 0)
    : 0;

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

        <DarkGradientBg className="min-h-0">
        <section className="relative pt-16 text-white md:min-h-[680px]">
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16 lg:px-10 lg:py-20">
            <div className="max-w-xl">
              <h1 className="text-3xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
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

              {totalCatalogItems > 0 ? (
                <p className="mt-6 text-xs text-white/40">
                  В каталоге уже {totalCatalogItems.toLocaleString("ru-RU")} AI-инструментов и ресурсов
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
        </DarkGradientBg>

        <PopularToolsSection payload={payload} loading={loading} />
      </main>
    </div>
  );
}
