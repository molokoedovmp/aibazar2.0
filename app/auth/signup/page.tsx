"use client";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import YandexStaticButton from "@/components/auth/YandexStaticButton";

const Spline = dynamic(() => import("@/app/components/home/SplineClient"), { ssr: false });

export default function SignupPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Не удалось создать аккаунт");
        return;
      }
      setEmail(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Левая колонка — робот */}
      <div className="relative hidden md:block bg-black">
        {/* Мобильный фон не нужен, так как колонка скрывается на sm */}
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/xasN6jN3w1ggRc6p/scene.splinecode" />
        </div>
        <div className="absolute inset-0 bg-black/50" />
        {/* Текст поверх робота */}
        <div className="absolute inset-0 flex items-center p-10">
          <div className="max-w-md text-white/90">
            <p className="text-sm uppercase tracking-widest text-white/70">AI Bazar</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight">Создаём умные продукты быстрее</h2>
            <p className="mt-3 text-sm text-white/80">Веб‑разработка, дизайн, внедрение AI и поддержка. Присоединяйтесь к сообществу и ускоряйтесь.</p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
        <p className="absolute bottom-4 left-6 text-xs text-white/60">© {new Date().getFullYear()} AI Bazar</p>
      </div>

      {/* Правая колонка — форма */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground mt-1">Начните бесплатно. Карта не требуется.</p>
          </div>

          <div className="grid gap-3 mb-4">
            <YandexStaticButton className="w-full" />
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">или продолжить с email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {sent ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
              <div className="text-lg font-medium">Письмо отправлено</div>
              <p className="mt-2 text-sm text-gray-600">Мы отправили ссылку для подтверждения на {email}. Перейдите по ней, затем войдите.</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <Link href="/auth/login" className="underline">Перейти ко входу</Link>
              </div>
            </div>
          ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium">Имя</label>
              <input
                type="text"
                required
                placeholder="Иван Иванов"
                name="name"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground"
              />
            </div>
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
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="flex items-center gap-2">
              <input id="terms" type="checkbox" className="h-4 w-4 rounded border" />
              <label htmlFor="terms" className="text-sm text-muted-foreground">Я принимаю <a href="#" className="underline">Условия</a> и <a href="#" className="underline">Политику</a></label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-background text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Отправляем..." : "Зарегистрироваться"}
            </button>
          </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт? <Link href="/auth/login" className="underline">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
