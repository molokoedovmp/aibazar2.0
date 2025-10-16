"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Не удалось отправить письмо");
      }
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Восстановление доступа</h1>
        {sent ? (
          <>
            <p className="mt-3 text-sm text-gray-600">Мы отправили письмо со ссылкой на сброс пароля на {email}.</p>
            <div className="mt-6 flex items-center gap-3">
              <Link href="/auth/login" className="underline text-sm">Вернуться ко входу</Link>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground"
              />
            </div>
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-background text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Отправляем..." : "Отправить ссылку"}
            </button>
            <div className="text-sm text-gray-600">
              Вспомнили пароль? <Link href="/auth/login" className="underline">Войти</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

