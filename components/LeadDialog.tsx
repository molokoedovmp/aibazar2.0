"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  triggerLabel?: string;
  source?: string; // about | services | custom
  variant?: "default" | "outline";
  className?: string;
};

export default function LeadDialog({ triggerLabel = "Оставить заявку", source = "unknown", variant = "default", className }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  async function submit() {
    if (loading) return;
    setLoading(true);
    setOk(false);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, telegram, message, source }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Ошибка отправки");
      setOk(true);
      setName("");
      setEmail("");
      setTelegram("");
      setMessage("");
    } catch (e) {
      alert((e as Error).message || "Не удалось отправить заявку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant === "outline" ? "outline" : "default"} className={className}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Оставить заявку</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Укажите контакты и коротко опишите задачу. Получим письмо и свяжемся.</p>
        </DialogHeader>
        {ok ? (
          <div className="py-4 text-sm">
            Заявка отправлена. Мы напишем на указанную почту/телеграм в ближайшее время.
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <Input placeholder="Как к вам обращаться" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Telegram или телефон" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
            <Textarea rows={4} placeholder="Коротко опишите задачу" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? "Отправляем…" : "Отправить"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

