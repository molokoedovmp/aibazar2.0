"use client";

import {
  ArrowUpRight,
  BookOpenText,
  Instagram,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";

import { Footer } from "@/app/components/footer";
import Stars from "@/app/components/home/Stars";
import { Navbar } from "@/app/components/navbar";
import { YandexZenIcon } from "@/components/YandexZenIcon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DZEN_URL = "https://dzen.ru/aibazar?share_to=link";
const TELEGRAM_URL = "https://t.me/aiBazar1";
const INSTAGRAM_URL = "https://www.instagram.com/aibazaru/";

const faqItems = [
  {
    question: "Что такое AI Bazar?",
    answer:
      "AI Bazar — это каталог нейросетей и полезных AI-инструментов. Мы собираем сервисы в одном месте, распределяем их по категориям и помогаем быстрее подобрать решение под конкретную задачу.",
  },
  {
    question: "Как выбрать подходящую нейросеть?",
    answer:
      "Откройте каталог, выберите категорию или воспользуйтесь поиском. На странице каждого инструмента есть описание, стоимость, ссылка на официальный сайт и похожие сервисы.",
  },
  {
    question: "Как рассчитывается цена подписки в рублях?",
    answer:
      "Стоимость пересчитывается из долларов по актуальному курсу с учётом расходов на проведение оплаты. Тот же расчёт доступен на отдельной странице «Калькулятор цен».",
  },
  {
    question: "Как часто обновляется каталог?",
    answer:
      "Мы регулярно добавляем новые инструменты, обновляем описания, категории и ссылки. Самые интересные обновления публикуем в наших каналах.",
  },
  {
    question: "Можно ли предложить нейросеть для каталога?",
    answer:
      "Да. Напишите нам в Telegram и пришлите название, официальный сайт и краткое описание инструмента — мы проверим его перед добавлением.",
  },
  {
    question: "Где читать обзоры и инструкции?",
    answer:
      "Подробные обзоры, подборки и практические инструкции выходят в канале AI Bazar в Дзене. Короткие новости и обновления публикуются в Telegram.",
  },
  {
    question: "Нужна ли регистрация для просмотра каталога?",
    answer:
      "Нет, каталог и описания доступны без регистрации. Аккаунт понадобится для сохранения инструментов в избранное и использования персональных возможностей сайта.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <Script id="model-viewer-meshopt" strategy="afterInteractive">
        {`self.ModelViewerElement = self.ModelViewerElement || {};
self.ModelViewerElement.meshoptDecoderLocation = "https://cdn.jsdelivr.net/npm/meshoptimizer@0.24.0/meshopt_decoder.js";`}
      </Script>
      <Script
        id="model-viewer"
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <main>
        <section className="relative flex min-h-[calc(100svh-56px)] items-center overflow-hidden bg-black text-white md:min-h-[calc(100svh-4rem)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_15%_85%,rgba(114,72,255,0.18),transparent_30%)]" />
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:72px_72px]" />
            <Stars />
          </div>

          <div className="relative mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-4 lg:px-10 lg:py-10">
            <div className="relative z-10 min-w-0 max-w-2xl">
              <h1 className="text-4xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Следите за миром AI вместе с нами
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
                Собираем полезные нейросети, проверяем инструменты на практике и
                публикуем понятные разборы без лишнего шума.
              </p>
              <Link
                href="/catalog"
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 font-medium text-black transition-transform duration-300 hover:-translate-y-0.5"
              >
                Перейти в каталог
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="relative mx-auto h-[38svh] min-h-[280px] w-full min-w-0 max-w-[680px] sm:h-[48svh] lg:h-[min(76svh,720px)]">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
              <model-viewer
                src="/Robot_Doodle_1002171232_texture.glb"
                alt="3D-модель робота AI Bazar"
                loading="auto"
                reveal="auto"
                interaction-prompt="none"
                exposure="0.9"
                shadow-intensity="0.8"
                bounds="tight"
                camera-orbit="30deg 65deg 110%"
                camera-target="0m -0.02m 0m"
                field-of-view="25deg"
                min-field-of-view="25deg"
                max-field-of-view="25deg"
                style={{ width: "100%", height: "100%", background: "transparent" }}
                disable-zoom
              >
                <div
                  slot="poster"
                  className="absolute inset-0 flex items-center justify-center text-sm text-white/45"
                >
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
                    Загружаем 3D-модель…
                  </span>
                </div>
              </model-viewer>
            </div>
          </div>
        </section>

        <section className="bg-[#f4f4f0] px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Наши каналы
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-black/60 lg:justify-self-end">
                Публикуем обзоры нейросетей, инструкции и подборки, которые можно
                сразу применять в работе, творчестве и бизнесе.
              </p>
            </div>

            <article className="relative mt-10 overflow-hidden rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-9">
              <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-black/[0.06] blur-3xl" />
              <div className="relative grid gap-10 md:grid-cols-[1fr_0.8fr] md:items-center">
                <div>
                  <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black text-white sm:h-20 sm:w-20">
                      <YandexZenIcon className="h-9 w-9 sm:h-11 sm:w-11" />
                    </span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/40">
                        Канал в Дзене
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold sm:text-3xl">AI Bazar</h3>
                      <p className="mt-1 text-sm text-black/50">dzen.ru/aibazar</p>
                    </div>
                  </div>
                  <p className="mt-6 max-w-xl text-base leading-7 text-black/65">
                    Подробно разбираем новые AI-сервисы, сравниваем возможности и
                    собираем практические сценарии использования.
                  </p>
                  <Link
                    href={DZEN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-6 inline-flex items-center gap-3 rounded-full bg-black px-6 py-3.5 font-medium text-white transition-transform hover:-translate-y-0.5"
                  >
                    Открыть канал
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>

                <div className="rounded-3xl bg-black p-6 text-white sm:p-7">
                  <div className="flex items-center gap-2 text-sm text-white/55">
                    <BookOpenText className="h-4 w-4" />
                    Что публикуем
                  </div>
                  <ul className="mt-5 space-y-3">
                    {["Обзоры нейросетей", "Пошаговые инструкции", "Подборки AI-инструментов"].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-3 text-sm sm:text-base">
                          <Sparkles className="h-4 w-4 shrink-0 text-white/50" />
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </article>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Link
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                  <Send className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-[0.18em] text-black/40">Telegram</span>
                  <span className="mt-1 block text-lg font-semibold">@aiBazar1</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0" />
              </Link>
              <Link
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                  <Instagram className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-[0.18em] text-black/40">Instagram</span>
                  <span className="mt-1 block text-lg font-semibold">@aibazaru</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.65fr_1fr] lg:gap-20">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-black/45">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Частые вопросы
              </h2>
              <p className="mt-4 max-w-md leading-7 text-black/60">
                Короткие ответы о каталоге, ценах, обновлениях и материалах AI Bazar.
              </p>
            </div>

            <Accordion type="single" collapsible className="border-t border-black/10">
              {faqItems.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-black/10">
                  <AccordionTrigger className="py-5 text-base font-medium hover:no-underline sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-5 pr-8 leading-7 text-black/60">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <div className="border-t border-black/10">
        <Footer />
      </div>
    </div>
  );
}
