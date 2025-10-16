"use client";

import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CheckoutFormProps {
  toolId: string;
  toolName: string;
  priceRub: number;
  userEmail?: string | null;
  userName?: string | null;
}

export function CheckoutForm({ toolId, toolName, priceRub, userEmail, userName }: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: userName ?? "",
    email: userEmail ?? "",
    telegram: "",
    comment: "",
  });

  const onChange = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolId,
            priceRub,
            contact: {
              name: form.name,
              email: form.email,
              telegram: form.telegram,
            },
            comment: form.comment,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Не удалось оформить заказ");
        }

        const data = await res.json();
        const url: string | undefined = data?.confirmationUrl;
        if (!url) throw new Error("Не удалось получить ссылку для оплаты");
        window.location.href = url;
      } catch (err: any) {
        setError(err?.message || "Неизвестная ошибка");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="name">Имя</label>
        <Input
          id="name"
          value={form.name}
          onChange={onChange("name")}
          placeholder="Как к вам обращаться"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={onChange("email")}
          placeholder="example@domain.com"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="telegram">Telegram или телефон</label>
        <Input
          id="telegram"
          value={form.telegram}
          onChange={onChange("telegram")}
          placeholder="@username или номер"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="comment">Комментарий</label>
        <Textarea
          id="comment"
          value={form.comment}
          onChange={onChange("comment")}
          placeholder="Укажите дополнительные пожелания"
          rows={4}
        />
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button type="submit" disabled={isPending} className="w-full h-12 text-base font-semibold">
        {isPending ? "Создаём оплату..." : `Перейти к оплате (${priceRub.toLocaleString("ru-RU")} ₽)`}
      </Button>
    </form>
  );
}

export default CheckoutForm;
