'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import TransitionButton from '@/app/components/home/TransitionButton';
import Stars from "@/app/components/home/Stars";
import FeaturePage from './FeatureSection';
import PaymentInstructionSection from './payment-instruction';

// import FeaturePage from './FeatureSection';
import ContentPage from '@/app/components/home/ContentSection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';



const Spline = dynamic(() => import("@/app/components/home/SplineClient"), { ssr: false });
  // Исправлено: переносим параметры внутрь объекта, передаваемого в dynami

export function Landingsecond() {
  const formatPrice = (price?: number) => {
    if (price === undefined || price === 0) return 'Бесплатно';
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

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
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white mb-2 w-fit">
                  AI-инструменты и сервисы
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
                  Мощь AI <span>под вашим</span> контролем
                </h1>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                  Всё в одном месте
                </h2>
                <p className="text-lg md:text-xl mb-8 text-white/80">
                  Здесь собрана большая библиотека из AI инструментов для решения ваших задач. Всё в одном месте.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <TransitionButton
                    size="lg"
                    className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4 rounded-full flex items-center justify-center shadow-lg w-full sm:w-auto"
                    path="/catalog"
                  >
                    Смотреть <ArrowRight className="ml-2 h-5 w-5" />
                  </TransitionButton>
                  <TransitionButton
                    size="lg"
                    className="bg-transparent text-white hover:bg-white/10 border border-white/50 text-lg px-8 py-4 rounded-full flex items-center justify-center w-full sm:w-auto"
                    path="/blog"
                  >
                    Сообщество
                  </TransitionButton>
                </div>

                <div className="hidden md:flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">AI Контент</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Безопасность</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Быстрый доступ</span>
                  </div>
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

        {/* Остальные секции — без изменений */}
        <section className="relative">
          <PaymentInstructionSection />
        </section>

        <section className="relative py-12 bg-white dark:bg-black flex justify-center items-center">
          <div className="relative z-10">
            <ContentPage />
          </div>
        </section>

        <section >
         
            <FeaturePage /> 

        </section>

        <section className="relative py-24 bg-white dark:bg-black">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent top-1/4" />
            <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent bottom-1/4" />
            <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-800 to-transparent left-1/4" />
            <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-800 to-transparent right-1/4" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 pb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
              Часто задаваемые вопросы
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question: 'Как осуществляется оплата за подписку на Ai инструменты?',
                    answer:
                      'Оплата подписки и услуг осуществляется через безопасные платежные системы. Вы можете выбрать удобный для вас способ оплаты, включая банковские карты, электронные кошельки и другие методы.',
                  },
                  {
                    question: 'Как работает услуга по разработке кастомных AI решений?',
                    answer:
                      'Наша услуга по разработке кастомных AI решений начинается с консультации для понимания ваших специфических потребностей. Затем мы разрабатываем и внедряем индивидуальное AI решение для вашего бизнеса.',
                  },
                  {
                    question: 'Какие преимущества я получу, присоединившись к сообществу?',
                    answer:
                      'Получите доступ к реальным кейсам, обмену опытом и советам от экспертов.',
                  },
                  {
                    question: 'Как мне понять, какой именно AI мне нужен?',
                    answer:
                      'Свяжитесь с менеджером в телеграм-чате — подскажем по вашим задачам.',
                  },
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 dark:border-gray-800">
                    <AccordionTrigger className="hover:text-gray-700 dark:hover:text-gray-300 py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 dark:text-gray-300 pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
