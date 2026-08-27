"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CheckoutFormProps = {
  toolId: string;
  toolName: string;
  priceRub: number;
  userEmail?: string | null;
  userName?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function CheckoutForm({ toolId, priceRub, userEmail, userName }: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: userName ?? "",
    email: userEmail ?? "",
    telegram: "",
    comment: "",
  });

  const onChange = (key: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((previous) => ({ ...previous, [key]: event.target.value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/orders", {
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

        const data: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message = isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Не удалось оформить заказ";
          throw new Error(message);
        }

        const confirmationUrl = isRecord(data) && typeof data.confirmationUrl === "string"
          ? data.confirmationUrl
          : null;
        if (!confirmationUrl) throw new Error("Не удалось получить ссылку для оплаты");

        window.location.href = confirmationUrl;
      } catch (caughtError: unknown) {
        setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка");
      }
    });
  };

  const fieldClassName = "h-11 rounded-xl border-black/10 bg-[#f7f7f5] px-3 text-sm shadow-none focus-visible:border-black/30 focus-visible:ring-0";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-black/60" htmlFor="name">Имя</label>
        <Input
          id="name"
          value={form.name}
          onChange={onChange("name")}
          placeholder="Как к вам обращаться"
          className={fieldClassName}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-black/60" htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={onChange("email")}
          placeholder="example@domain.com"
          className={fieldClassName}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-black/60" htmlFor="telegram">Telegram или телефон</label>
        <Input
          id="telegram"
          value={form.telegram}
          onChange={onChange("telegram")}
          placeholder="@username или номер"
          className={fieldClassName}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-black/60" htmlFor="comment">Комментарий</label>
        <Textarea
          id="comment"
          value={form.comment}
          onChange={onChange("comment")}
          placeholder="Дополнительные пожелания"
          rows={3}
          className="resize-none rounded-xl border-black/10 bg-[#f7f7f5] px-3 py-3 text-sm shadow-none focus-visible:border-black/30 focus-visible:ring-0"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "Создаём оплату..."
          : `Перейти к оплате — ${priceRub.toLocaleString("ru-RU")} ₽`}
      </button>
    </form>
  );
}

export default CheckoutForm;
