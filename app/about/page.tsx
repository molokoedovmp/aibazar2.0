import type { Metadata } from "next";
import {
  ArrowUpRight,
  Instagram,
  Send,
} from "lucide-react";
import Link from "next/link";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { YandexZenIcon } from "@/components/YandexZenIcon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DZEN_URL = "/out/dzen";
const TELEGRAM_URL = "https://t.me/aiBazar1";
const INSTAGRAM_URL = "https://www.instagram.com/aibazaru/";

export const metadata: Metadata = {
  title: "О библиотеке нейросетей и AI-инструментов",
  description:
    "Узнайте об aiBazar — большой библиотеке нейросетей, AI-инструментов, MCP-серверов, промптов, навыков и open-source проектов для поиска решений под конкретные задачи.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "О библиотеке нейросетей и AI-инструментов aiBazar",
    description:
      "Каталог AI-ресурсов с понятными описаниями, категориями и рейтингами для быстрого поиска инструмента под задачу.",
    url: "/about",
  },
};

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
    <div className="min-h-screen text-black dark:text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <section className="py-16 sm:py-24">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Библиотека нейросетей и AI-инструментов
          </h1>
          <div className="mt-8 grid gap-8 border-t border-black/10 pt-8 dark:border-white/10 lg:grid-cols-[1fr_0.65fr]">
            <p className="max-w-2xl text-base leading-7 text-black/60 dark:text-white/60 sm:text-lg">
              Собираем нейросети, MCP-серверы, промпты, навыки и open-source проекты в одной библиотеке с понятными описаниями и быстрым поиском по задаче.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-self-end">
              <Link href="/catalog" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-black/80 dark:bg-white dark:text-black">
                Открыть каталог
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="#channels" className="inline-flex h-12 items-center justify-center rounded-xl border border-black/15 px-6 text-sm font-semibold transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
                Наши каналы
              </Link>
            </div>
          </div>
        </section>

        <section id="channels" className="border-t border-black/10 py-16 dark:border-white/10 sm:py-24">
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Где следить за aiBazar</h2>
            <p className="max-w-2xl text-base leading-7 text-black/60 dark:text-zinc-400 lg:justify-self-end">
              Обзоры, новые инструменты и короткие практические материалы — в удобном для вас формате.
            </p>
          </div>

          <div className="mt-10 border-y border-black/10 dark:border-white/10">
            <Link href={DZEN_URL} target="_blank" rel="noreferrer" className="group grid gap-5 border-b border-black/10 py-7 transition hover:pl-2 dark:border-white/10 sm:grid-cols-[56px_0.7fr_1.3fr_auto] sm:items-center">
              <YandexZenIcon className="h-10 w-10 text-black/75 dark:text-white/75" />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-black/40 dark:text-white/40">Дзен</div>
                <div className="mt-1 text-xl font-semibold">AI Bazar</div>
              </div>
              <p className="max-w-xl text-sm leading-6 text-black/55 dark:text-white/55">
                Подробные обзоры нейросетей, сравнения и практические сценарии использования.
              </p>
              <ArrowUpRight className="h-5 w-5 text-black/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-white/40" />
            </Link>
            {[
              { title: "Telegram", subtitle: "@aiBazar1", description: "Новые публикации и быстрые обновления каталога.", href: TELEGRAM_URL, icon: Send },
              { title: "Instagram", subtitle: "@aibazaru", description: "Короткие подборки и визуальные материалы.", href: INSTAGRAM_URL, icon: Instagram },
            ].map(({ title, subtitle, description, href, icon: Icon }, index) => (
              <Link key={title} href={href} target="_blank" rel="noreferrer" className={`group grid gap-5 py-7 transition hover:pl-2 sm:grid-cols-[56px_0.7fr_1.3fr_auto] sm:items-center ${index === 0 ? "border-b border-black/10 dark:border-white/10" : ""}`}>
                <Icon className="h-8 w-8 text-black/70 dark:text-white/70" />
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-black/40 dark:text-white/40">{title}</div>
                  <div className="mt-1 text-lg font-semibold">{subtitle}</div>
                </div>
                <p className="max-w-xl text-sm leading-6 text-black/55 dark:text-white/55">{description}</p>
                <ArrowUpRight className="h-5 w-5 text-black/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-white/40" />
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-black/10 py-16 dark:border-white/10 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1fr] lg:gap-20">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-black/45">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Частые вопросы
              </h2>
              <p className="mt-4 max-w-md leading-7 text-black/60 dark:text-white/60">
                Короткие ответы о каталоге, ценах, обновлениях и материалах AI Bazar.
              </p>
            </div>

            <Accordion type="single" collapsible className="border-t border-black/10 dark:border-white/10">
              {faqItems.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-black/10 dark:border-white/10">
                  <AccordionTrigger className="py-5 text-base font-medium hover:no-underline sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-5 pr-8 leading-7 text-black/60 dark:text-white/60">
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
