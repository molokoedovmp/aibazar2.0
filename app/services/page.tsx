"use client";

import Link from "next/link";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Code, Brain, Globe, Shield, Sparkles, Clock } from "lucide-react";
import LeadDialog from "@/components/LeadDialog";

export default function ServicesLanding() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),rgba(0,0,0,0))]" />
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Услуги AI Bazar</h1>
            <p className="mt-4 text-base/7 text-white/80 sm:text-lg/8">
              Помогаем бизнесу запускать продукты быстрее: от разработки веб‑сайтов и e‑commerce до внедрения AI‑решений
              и автоматизации. Выбирайте направление — мы сделаем красиво, быстро и с измеримым результатом.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#services">
                <Button className="bg-white text-black hover:bg-white/90">Посмотреть услуги</Button>
              </Link>
              <LeadDialog
                source="services-hero"
                triggerLabel="Обсудить проект"
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white hover:text-black"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ключевые преимущества */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <Sparkles className="mt-0.5 h-5 w-5 text-black" />
            <div>
              <p className="font-medium">Дизайн и UX</p>
              <p className="text-sm text-muted-foreground">Современная визуальная подача и удобство для конверсии.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <Clock className="mt-0.5 h-5 w-5 text-black" />
            <div>
              <p className="font-medium">Сроки и прозрачность</p>
              <p className="text-sm text-muted-foreground">Поэтапный план, фиксированные дедлайны и отчётность.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <Shield className="mt-0.5 h-5 w-5 text-black" />
            <div>
              <p className="font-medium">Надёжная поддержка</p>
              <p className="text-sm text-muted-foreground">Сопровождение, мониторинг и развитие после запуска.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <Brain className="mt-0.5 h-5 w-5 text-black" />
            <div>
              <p className="font-medium">AI‑экспертиза</p>
              <p className="text-sm text-muted-foreground">Внедряем AI‑инструменты под задачи и бюджет.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Услуги: карточки */}
      <section id="services" className="mx-auto max-w-7xl px-6 pb-8 lg:px-10 lg:pb-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Что мы делаем</h2>
            <p className="mt-1 text-sm text-muted-foreground">Выберите направление — детали на отдельной странице.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Веб‑разработка и дизайн</CardTitle>
                  <CardDescription>Сайты, лендинги, e‑commerce, SEO и поддержка</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Делаем быстрые и красивые сайты на современных технологиях с ориентацией на конверсию и бизнес‑цели.</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-muted-foreground">
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />Лендинги и корпоративные сайты</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />Интернет‑магазины</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />UI/UX дизайн</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />SEO и аналитика</li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/services/webservices">
                <Button className="bg-black text-white hover:bg-black/90">
                  Подробнее <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services/webservices">
                <Button variant="ghost" className="text-muted-foreground hover:text-black">Портфолио</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* <Card className="group transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Bazarius — AI решения</CardTitle>
                  <CardDescription>Поиск и внедрение инструментов AI под ваши задачи</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Подбираем и внедряем AI‑инструменты: поиск, генерация презентаций, автоматизация процессов и обучение команды.</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-muted-foreground">
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />AI‑поиск инструментов</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />GPT для презентаций</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />Автоматизация и интеграции</li>
                <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-black" />Обучение и поддержка</li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/services/bazarius">
                <Button className="bg-black text-white hover:bg-black/90">
                  Подробнее <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services/bazarius">
                <Button variant="ghost" className="text-muted-foreground hover:text-black">Демо и примеры</Button>
              </Link>
            </CardFooter>
          </Card> */}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-black to-black/80 p-8 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Готовы обсудить задачу?</h3>
              <p className="mt-1 text-white/80">Расскажите о проекте — предложим вариант, сроки и бюджет.</p>
            </div>
            <div className="flex gap-3">
              <LeadDialog source="services-cta" triggerLabel="Оставить заявку" className="bg-white text-black hover:bg-white/90" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
