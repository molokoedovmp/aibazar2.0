"use client";

import { useMemo, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type OrderReceiptDialogProps = {
  order: {
    id: string;
    serviceName: string | null;
    amount: number;
    status: string;
    createdAt: Date;
    paidAt: Date | null;
    details: string | null;
    contactInfo: string | null;
    confirmationUrl: string | null;
    paymentId: string | null;
  };
  children?: ReactNode;
};

type Contact = {
  name?: string;
  email?: string;
  telegram?: string;
};

const statusLabels: Record<string, string> = {
  completed: "Завершено",
  pending: "Ожидает оплаты",
  failed: "Не завершено",
};

export function OrderReceiptDialog({ order, children }: OrderReceiptDialogProps) {
  const contact = useMemo<Contact | null>(() => {
    if (!order.contactInfo) return null;
    try {
      const parsed: unknown = JSON.parse(order.contactInfo);
      return typeof parsed === "object" && parsed !== null ? parsed as Contact : null;
    } catch {
      return null;
    }
  }, [order.contactInfo]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button type="button" className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-black/55">
            Чек
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl border-black/10 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-black">Заказ #{order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>{order.serviceName || "AI-инструмент"}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3 text-sm text-black/55">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-black/[0.035] px-3 py-3">
            <span>Сумма</span>
            <strong className="text-base text-black">{order.amount.toLocaleString("ru-RU")} ₽</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span>Статус</span>
            <span className="font-semibold text-black">{statusLabels[order.status] || order.status}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Создан</span>
            <span className="text-right text-black">{order.createdAt.toLocaleString("ru-RU")}</span>
          </div>
          {order.paidAt && (
            <div className="flex justify-between gap-4">
              <span>Оплачен</span>
              <span className="text-right text-black">{order.paidAt.toLocaleString("ru-RU")}</span>
            </div>
          )}

          {contact && (contact.name || contact.email || contact.telegram) && (
            <>
              <Separator />
              <div>
                <div className="font-semibold text-black">Контакты</div>
                <div className="mt-2 space-y-1 text-xs">
                  {contact.name && <div>Имя: {contact.name}</div>}
                  {contact.email && <div>Email: {contact.email}</div>}
                  {contact.telegram && <div>Telegram или телефон: {contact.telegram}</div>}
                </div>
              </div>
            </>
          )}

          {order.details && (
            <>
              <Separator />
              <div>
                <div className="font-semibold text-black">Комментарий</div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-5">{order.details}</p>
              </div>
            </>
          )}

          {order.confirmationUrl && order.status === "pending" && (
            <a
              href={order.confirmationUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center justify-center rounded-xl bg-black text-xs font-semibold text-white"
            >
              Перейти к оплате
            </a>
          )}

          {order.paymentId && <div className="break-all text-[10px] text-black/30">Payment ID: {order.paymentId}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OrderReceiptDialog;
