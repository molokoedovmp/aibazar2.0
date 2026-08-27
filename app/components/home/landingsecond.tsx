'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import TransitionButton from '@/app/components/home/TransitionButton';
import Stars from "@/app/components/home/Stars";
import PopularToolsSection from './PopularToolsSection';
const Spline = dynamic(() => import("@/app/components/home/SplineClient"), { ssr: false });
  // Исправлено: переносим параметры внутрь объекта, передаваемого в dynami

export function Landingsecond() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
      <main className="flex-1">
        <meta name="yandex-verification" content="31f9fbf9bddca189" />

        {/* HERO */}
        {/* Делает фон всегда тёмным и на десктопе */}
        <section className="relative z-10 w-full overflow-hidden bg-black h-[100dvh] md:h-[calc(100dvh-64px)]">
          {/* ===== Мобильный фон: ЧЁРНЫЙ + робот позади ===== */}
          <div className="lg:hidden absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-black" />
            <div className="absolute inset-0">
              <Spline
                scene="https://prod.spline.design/xasN6jN3w1ggRc6p/scene.splinecode"
                // className="w-full h-full"
              />
            </div>
            <div className="absolute inset-0 bg-black/40" />
            {/* Нижний градиент внутри секции, без выхода за границы */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
          </div>

          {/* Декор (поверх фона) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
            <Stars />
            <div className="absolute h-64 w-64 border border-gray-800 rounded-full -top-32 -left-32 opacity-50" />
            <div className="absolute h-96 w-96 border border-gray-800 rounded-full -bottom-48 -right-48 opacity-50" />
            <div className="absolute h-px w-1/3 bg-gradient-to-r from-transparent via-gray-800 to-transparent top-1/4 left-0" />
            <div className="absolute h-px w-1/3 bg-gradient-to-r from-transparent via-gray-800 to-transparent bottom-1/4 right-0" />

            {/* ОДНА звёздочка для десктопа */}
            <svg
              className="hidden lg:block absolute top-16 right-[15%] h-6 w-6 opacity-60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l2.09 4.24L18.8 8l-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7L5.2 8l4.71-.76L12 3z" />
            </svg>
          </div>

          {/* ===== Контент ===== */}
          {/* Делаем текст белым и на десктопе, чтобы сочетался с чёрным фоном */}
          <div className="container mx-auto px-4 py-0 relative z-[2] text-white h-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center content-center h-full overflow-hidden">
              {/* Левая колонка — текст (контент не менялся) */}
              <div className="flex flex-col justify-center lg:mt-0">
                <h1 className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                  Мощь AI <span>под вашим</span> контролем
                </h1>
                <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
                  Всё в одном месте
                </h2>
                <p className="mb-8 text-lg text-white/80 md:text-xl">
                  Здесь собрана большая библиотека из AI инструментов для решения ваших задач. Всё в одном месте.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <TransitionButton
                    size="lg"
                    className="flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-lg text-black shadow-lg hover:bg-gray-200 sm:w-auto"
                    path="/catalog"
                  >
                    Смотреть <ArrowRight className="ml-2 h-5 w-5" />
                  </TransitionButton>
                  <TransitionButton
                    size="lg"
                    className="flex w-full items-center justify-center rounded-full border border-white/50 bg-transparent px-8 py-4 text-lg text-white hover:bg-white/10 sm:w-auto"
                    path="/blog"
                  >
                    Сообщество
                  </TransitionButton>
                </div>
              </div>

              {/* Правая колонка — ТОЛЬКО ДЕСКТОП (как было) */}
              <div className="hidden lg:block relative h-[450px] md:h-[500px] lg:h-[550px]">
                <div className="absolute inset-4 border-2 border-dashed border-gray-700 rounded-3xl opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[90%] h-[90%] border border-gray-800 rounded-full opacity-30" />
                </div>
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-gray-800 rounded-full opacity-70" />
                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gray-800 rounded-full opacity-70" />
                <div className="absolute top-1/4 -left-4 w-8 h-1 bg-gray-800 rounded-full opacity-60" />
                <div className="absolute bottom-1/4 -right-4 w-8 h-1 bg-gray-800 rounded-full opacity-60" />
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-600 rounded-full opacity-70 animate-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-blue-600 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-red-600 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[90%] h-[90%] rounded-full bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 opacity-60 blur-xl" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl">
                  <Spline
                    scene="https://prod.spline.design/xasN6jN3w1ggRc6p/scene.splinecode"
                    // className="w-[110%] h-[110%]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <PopularToolsSection />
      </main>
    </div>
  );
}
