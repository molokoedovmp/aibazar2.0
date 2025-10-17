"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function ResetPasswordInner() {
  const search = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => search.get("token") || "", [search]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 8) {
      setError("Минимальная длина пароля — 8 символов");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Не удалось обновить пароль");
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (e: any) {
      setError(e?.message || "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Сброс пароля</h1>
        {done ? (
          <p className="mt-3 text-sm text-gray-600">Пароль обновлён. Перенаправляем на страницу входа...</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Новый пароль</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Подтверждение пароля</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground"
              />
            </div>
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-background text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Сохраняем..." : "Обновить пароль"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
