"use client";

import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";
import Stars from "@/app/components/home/Stars";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, Users, Sparkles, Shield, Heart, Workflow, Rocket, Clock, Instagram, Send } from "lucide-react";
import Link from "next/link";
import { YandexZenIcon } from "@/components/YandexZenIcon";
import Script from "next/script";
import LeadDialog from "@/components/LeadDialog";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      {/* Hero */}
  <section className="relative overflow-hidden bg-black text-white">
        <Script
          id="model-viewer"
          type="module"
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          strategy="afterInteractive"
        />
        <Script
          id="model-viewer-legacy"
          noModule
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer-legacy.js"
          strategy="afterInteractive"
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),rgba(0,0,0,0))]" />
          <Stars />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28 relative">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-3xl">
            <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10">Команда и миссия</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">О нас</h1>
            <p className="mt-4 text-white/80 text-base sm:text-lg">
              AI Bazar — это команда, объединённая идеей делать цифровые продукты быстрее и умнее. Мы разрабатываем сайты и сервисы,
              внедряем AI‑инструменты и помогаем компаниям масштабироваться.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/services">
                <Button className="bg-white text-black hover:bg-white/90">Наши услуги</Button>
              </Link>
              <LeadDialog
                source="about-hero"
                triggerLabel="Обсудить проект"
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white hover:text-black transition-colors"
              />
            </div>

            {/* Соцсети */}
            <div className="mt-6 flex items-center gap-3 text-white/80">
              <span className="text-sm">Мы в соцсетях:</span>
              <Link href="https://dzen.ru/aibazar?share_to=link" target="_blank" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20">
                <YandexZenIcon className="h-5 w-5 text-white" />
              </Link>
              <Link href="https://t.me/aiBazar1" target="_blank" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20">
                <Send className="h-5 w-5 text-white" />
              </Link>
              <Link href="https://www.instagram.com/aibazaru/" target="_blank" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20">
                <Instagram className="h-5 w-5 text-white" />
              </Link>
            </div>
            </div>

            {/* 3D робот */}
            <div className="relative block">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative ml-auto aspect-square w-full max-w-[480px]">
                {/* @ts-ignore web-component */}
                <model-viewer
                  src="/Robot_Doodle_1002171232_texture.glb"
                  alt="3D робот"
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
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Миссия и ценности */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white"><Target className="h-5 w-5"/></div>
              <div>
                <CardTitle>Миссия</CardTitle>
                <CardDescription>Практичный результат</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Соединяем дизайн, технологию и AI, чтобы бизнес быстрее запускал продукты и видел измеримый эффект.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white"><Sparkles className="h-5 w-5"/></div>
              <div>
                <CardTitle>Подход</CardTitle>
                <CardDescription>Красиво и быстро</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Работаем итерациями, показываем прогресс каждую неделю. Делаем просто, понятно и с фокусом на конверсию.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white"><Shield className="h-5 w-5"/></div>
              <div>
                <CardTitle>Надёжность</CardTitle>
                <CardDescription>Поддержка 24/7</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Берём ответственность за результат и сопровождаем проекты после запуска: мониторинг, обновления и развитие.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Как мы работаем */}
      <section className="mx-auto max-w-7xl px-6 pb-4 lg:px-10">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Как мы работаем</h2>
        <p className="mt-1 text-sm text-muted-foreground">Простой и прозрачный процесс из 4 шагов.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[{
            icon: Users, title: "Созвон и бриф", desc: "Формулируем цели, сроки и метрики"},
            {icon: Workflow, title: "Дизайн и ТЗ", desc: "Сценарии, прототипы и визуал"},
            {icon: Rocket, title: "Разработка", desc: "Итеративно показываем прогресс"},
            {icon: Heart, title: "Запуск и поддержка", desc: "Мониторинг, улучшения, рост"},
          ].map((s, idx) => (
            <Card key={idx} className="h-full">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-black text-white">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground -mt-3">{s.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Немного фактов */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{icon: Users, num: "50+", text: "Клиентов"}, {icon: Rocket, num: "100+", text: "Проектов"}, {icon: Clock, num: "5+", text: "Лет опыта"}, {icon: Shield, num: "24/7", text: "Поддержка"}].map((i, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <i.icon className="h-5 w-5 text-black" />
              <div>
                <p className="text-xl font-semibold">{i.num}</p>
                <p className="text-sm text-muted-foreground">{i.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Команда (мини) */}
      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-10">
        <h3 className="text-xl font-semibold tracking-tight">Команда</h3>
        <p className="mt-1 text-sm text-muted-foreground">Над проектами работают дизайнеры, разработчики и эксперты по AI.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[{name: "Илья", role: "Продакт / AI"}, {name: "Михаил", role: "Frontend"}].map((p, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/logo.png" alt={p.name} />
                  <AvatarFallback>{p.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-black to-black/80 p-8 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-2xl font-semibold tracking-tight">Погнали делать классный продукт</h4>
              <p className="mt-1 text-white/80">Напишите нам пару строк — вернёмся с идеями и сроками.</p>
            </div>
            <div className="flex gap-3">
              <LeadDialog source="about-cta" triggerLabel="Оставить заявку" className="bg-white text-black hover:bg-white/90" />
              <a href="/services"><Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-black">Услуги</Button></a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
