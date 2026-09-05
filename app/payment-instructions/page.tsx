"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, MessageCircle } from "lucide-react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";

type InstructionStep = {
  title: string;
  description: string;
  image?: string;
  bullets?: string[];
};

type PaymentGuide = {
  label: string;
  title: string;
  description: string;
  notice?: string;
  steps: InstructionStep[];
};

const guides: PaymentGuide[] = [
  {
    label: "Ссылка на оплату",
    title: "Оплата по прямой ссылке",
    description: "Подходит, если сервис создаёт отдельную страницу оформления подписки.",
    steps: [
      {
        title: "Откройте страницу подписки",
        description: "Перейдите на официальный сайт нужного сервиса, выберите тариф и начните оформление подписки.",
        image: "/instruction/step.png",
      },
      {
        title: "Скопируйте ссылку",
        description: "На странице оплаты скопируйте полный адрес из адресной строки браузера.",
        image: "/instruction/step2.png",
      },
      {
        title: "Отправьте данные менеджеру",
        description: "Напишите нам в Telegram и отправьте ссылку на оплату.",
        bullets: ["Название сервиса", "Выбранный тариф", "Ссылка на страницу оплаты"],
        image: "/instruction/step3.png",
      },
      {
        title: "Подтвердите оплату",
        description: "Получите расчёт, оплатите заказ и дождитесь сообщения об успешной активации подписки.",
        image: "/instruction/step4.png",
      },
    ],
  },
  {
    label: "Через аккаунт",
    title: "Оплата через аккаунт сервиса",
    description: "Используется, когда подписку нельзя оформить по отдельной платёжной ссылке.",
    notice: "Не отправляйте данные банковской карты, коды из SMS и резервные коды. Если потребуется доступ к аккаунту, используйте временный пароль и смените его после активации.",
    steps: [
      {
        title: "Свяжитесь с менеджером",
        description: "Укажите название сервиса, тариф и срок подписки, который хотите оплатить.",
      },
      {
        title: "Уточните способ активации",
        description: "Менеджер проверит сервис и сообщит, потребуется ли временный доступ к вашему аккаунту.",
      },
      {
        title: "Оплатите заказ",
        description: "Получите итоговую стоимость и реквизиты, после чего отправьте подтверждение платежа.",
      },
      {
        title: "Проверьте подписку",
        description: "После активации войдите в сервис, убедитесь, что тариф подключён, и смените временный пароль.",
      },
    ],
  },
  {
    label: "Через aiBazar",
    title: "Оплата через страницу aiBazar",
    description: "Выберите инструмент в каталоге и оформите запрос на оплату внутри сайта.",
    steps: [
      {
        title: "Выберите AI-инструмент",
        description: "Откройте библиотеку, найдите нужный сервис и перейдите на его страницу.",
        image: "/instruction/step10.png",
      },
      {
        title: "Укажите стоимость",
        description: "Выберите тариф или введите стоимость подписки в долларах, чтобы увидеть расчёт в рублях.",
        image: "/instruction/step11.png",
      },
      {
        title: "Перейдите к оформлению",
        description: "Нажмите кнопку покупки и заполните контактные данные для связи с менеджером.",
        image: "/instruction/step12.png",
      },
      {
        title: "Получите подтверждение",
        description: "После оплаты дождитесь подтверждения и проверьте активацию подписки в выбранном сервисе.",
        image: "/instruction/step13.png",
      },
    ],
  },
];

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Как оплатить зарубежный AI-сервис из России",
  description:
    "Пошаговая инструкция по оплате зарубежных AI-сервисов с помощью aiBazar.",
  inLanguage: "ru-RU",
  totalTime: "PT15M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Выберите AI-сервис и тариф",
      text: "Откройте официальный сайт нужного AI-сервиса и выберите подходящий тариф.",
      url: "https://ai-bazar.ru/payment-instructions#payment-guide",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Отправьте данные менеджеру",
      text: "Пришлите в Telegram название сервиса, тариф и ссылку на страницу оплаты.",
      url: "https://ai-bazar.ru/payment-instructions#payment-guide",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Получите расчёт",
      text: "Менеджер проверит доступный способ оплаты и сообщит итоговую стоимость в рублях.",
      url: "https://ai-bazar.ru/payment-instructions#payment-guide",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Подтвердите активацию подписки",
      text: "После проведения оплаты проверьте, что выбранный тариф активирован в вашем аккаунте.",
      url: "https://ai-bazar.ru/payment-instructions#payment-guide",
    },
  ],
};

export default function PaymentInstructionsPage() {
  const [activeGuide, setActiveGuide] = useState(0);
  const guide = guides[activeGuide];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-black dark:bg-black dark:text-white">
      <Navbar />

      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(howToJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <section className="relative overflow-hidden border-b border-white/10 bg-black text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(139,92,246,0.23),transparent_30%),radial-gradient(circle_at_70%_100%,rgba(16,185,129,0.16),transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/55 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>

            <div className="mt-8 max-w-3xl">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Инструкция по оплате
              </span>
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Как оплатить AI-сервис из России
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                Выберите подходящий вариант и следуйте короткой пошаговой инструкции. Если останутся вопросы, менеджер поможет в Telegram.
              </p>
            </div>
          </div>
        </section>

        <div id="payment-guide" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
          <label className="block md:hidden">
            <span className="mb-2 block text-xs font-semibold text-black/50 dark:text-white/50">Способ оплаты</span>
            <select
              value={activeGuide}
              onChange={(event) => setActiveGuide(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-zinc-950"
            >
              {guides.map((item, index) => (
                <option key={item.label} value={index}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-7 grid min-w-0 gap-8 md:mt-0 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <aside className="hidden md:block">
              <div className="sticky top-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                  Способ оплаты
                </p>
                <nav className="space-y-1">
                  {guides.map((item, index) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveGuide(index)}
                      className={`w-full rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                        activeGuide === index
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <article className="min-w-0">
              <div className="border-b border-black/10 pb-6 dark:border-white/10">
                <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{guide.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-base">
                  {guide.description}
                </p>
              </div>

              {guide.notice ? (
                <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                  <Info className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="min-w-0 break-words text-sm leading-6">{guide.notice}</p>
                </div>
              ) : null}

              <ol className="mt-2">
                {guide.steps.map((step, index) => (
                  <li
                    key={step.title}
                    className={`grid min-w-0 gap-5 border-b border-black/10 py-7 dark:border-white/10 ${
                      step.image ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center" : ""
                    }`}
                  >
                    {step.image ? (
                      <div className="order-2 min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 md:order-1">
                        <Image
                          src={step.image}
                          alt={`${step.title}: пример`}
                          width={760}
                          height={460}
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    ) : null}

                    <div className="order-1 flex min-w-0 gap-3 sm:gap-4 md:order-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold sm:text-lg">{step.title}</h3>
                        <p className="mt-2 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          {step.description}
                        </p>
                        {step.bullets ? (
                          <ul className="mt-3 space-y-2">
                            {step.bullets.map((bullet) => (
                              <li key={bullet} className="flex min-w-0 items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="min-w-0 break-words">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="relative mt-8 flex flex-col gap-5 overflow-hidden rounded-[2rem] border border-white/10 bg-black bg-[radial-gradient(circle_at_16%_20%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(139,92,246,0.23),transparent_30%),radial-gradient(circle_at_70%_100%,rgba(16,185,129,0.16),transparent_28%)] p-5 text-white shadow-[0_14px_40px_rgba(0,0,0,0.12)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Нужна помощь с оплатой?</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                    Напишите менеджеру — поможем выбрать способ оплаты и рассчитаем итоговую стоимость.
                  </p>
                </div>
                <Link
                  href="https://t.me/aibazaru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="theme-light-button inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  Написать в Telegram
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
