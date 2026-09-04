import {
  ArrowUpRight,
  BookOpenText,
  Instagram,
  Send,
  Sparkles,
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
    <div className="min-h-screen bg-white text-black dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-black text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(139,92,246,0.23),transparent_30%),radial-gradient(circle_at_70%_100%,rgba(16,185,129,0.16),transparent_28%)]" />
                  <div className="relative mx-auto max-w-[1160px] px-4 py-14 sm:px-6 sm:py-20">
                    <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Следите за миром AI вместе с нами</h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">Собираем полезные нейросети, проверяем инструменты на практике и публикуем понятные разборы без лишнего шума.</p>
                  </div>
                </section>

        <section id="channels" className="bg-[#f4f4f0] px-5 py-16 dark:!bg-[#151517] sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Наши каналы
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-black/60 dark:text-zinc-400 lg:justify-self-end">
                Публикуем обзоры нейросетей, инструкции и подборки, которые можно
                сразу применять в работе, творчестве и бизнесе.
              </p>
            </div>

            <article className="relative mt-10 overflow-hidden rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-zinc-900 sm:p-9">
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
                  <p className="mt-6 max-w-xl text-base leading-7 text-black/65 dark:text-zinc-300">
                    Подробно разбираем новые AI-сервисы, сравниваем возможности и
                    собираем практические сценарии использования.
                  </p>
                  <Link
                    href={DZEN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="theme-light-button group mt-6 inline-flex items-center gap-3 rounded-full bg-black px-6 py-3.5 font-medium text-white transition-transform hover:-translate-y-0.5"
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
                className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900"
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
                className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900"
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

        <section className="border-t border-black/10 bg-[#fbfbf9] px-5 py-16 dark:border-white/10 dark:bg-black sm:px-8 sm:py-24 lg:px-10">
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
