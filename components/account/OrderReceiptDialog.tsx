"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface OrderReceiptDialogProps {
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
  children?: React.ReactNode;
}

export function OrderReceiptDialog({ order, children }: OrderReceiptDialogProps) {
  const contact = useMemo(() => {
    try {
      if (!order.contactInfo) return null;
      return JSON.parse(order.contactInfo);
    } catch {
      return null;
    }
  }, [order.contactInfo]);

  const trigger = children || (
    <Button variant="outline" size="sm" className="w-full justify-center">
      Чек
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Чек по заказу #{order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>
            {order.serviceName ?? "AI инструмент"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex justify-between text-base font-semibold text-slate-900">
            <span>Сумма</span>
            <span>{order.amount.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div className="flex justify-between">
            <span>Статус</span>
            <span className="font-medium">{order.status}</span>
          </div>
          <div className="flex justify-between">
            <span>Создан</span>
            <span>{order.createdAt.toLocaleString("ru-RU")}</span>
          </div>
          {order.paidAt && (
            <div className="flex justify-between">
              <span>Оплачен</span>
              <span>{order.paidAt.toLocaleString("ru-RU")}</span>
            </div>
          )}
          {contact && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">Контакты</div>
                {contact.name && <div>Имя: {contact.name}</div>}
                {contact.email && <div>Email: {contact.email}</div>}
                {contact.telegram && <div>Telegram/Телефон: {contact.telegram}</div>}
              </div>
            </>
          )}
          {order.details && (
            <div>
              <Separator className="my-2" />
              <div className="font-semibold text-slate-900">Комментарий</div>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">{order.details}</p>
            </div>
          )}
          {order.confirmationUrl && order.status === "pending" && (
            <div>
              <Separator className="my-2" />
              <a
                href={order.confirmationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Перейти к оплате
              </a>
            </div>
          )}
          {order.paymentId && (
            <div className="text-xs text-slate-400">Payment ID: {order.paymentId}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OrderReceiptDialog;
