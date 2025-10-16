"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import dynamic from "next/dynamic";
import YandexStaticButton from "@/components/auth/YandexStaticButton";

const Spline = dynamic(() => import("@/app/components/home/SplineClient"), { ssr: false });

export default function LoginPage() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const res = await signIn("credentials", { email, password, redirect: true, callbackUrl: "/account" });
    if ((res as any)?.error) alert("Неверный email или пароль. Возможно, вы ещё не подтвердили почту.");
  }
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Левая колонка — робот */}
      <div className="relative hidden md:block bg-black">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/xasN6jN3w1ggRc6p/scene.splinecode" />
        </div>
        <div className="absolute inset-0 bg-black/50" />
        {/* Текст поверх робота */}
        <div className="absolute inset-0 flex items-center p-10">
          <div className="max-w-md text-white/90">
            <p className="text-sm uppercase tracking-widest text-white/70">AI Bazar</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight">Добро пожаловать обратно</h2>
            <p className="mt-3 text-sm text-white/80">Продолжайте работу с инструментами и проектами. Вход за секунды через Яндекс ID.</p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
        <p className="absolute bottom-4 left-6 text-xs text-white/60">© {new Date().getFullYear()} AI Bazar</p>
      </div>

      {/* Правая колонка — форма входа */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Войти</h1>
            <p className="text-sm text-muted-foreground mt-1">Рады видеть вас снова.</p>
          </div>

          <div className="grid gap-3 mb-4">
            <YandexStaticButton className="w-full" />
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">или по email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                name="email"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Пароль</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                name="password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="h-4 w-4 rounded border" />
                Запомнить меня
              </label>
              <Link href="/auth/forgot" className="underline">Забыли пароль?</Link>
            </div>
            <button
              type="submit"
              className="w-full inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-background text-sm font-medium transition-colors hover:opacity-90"
            >
              Войти
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Нет аккаунта? <Link href="/auth/signup" className="underline">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
