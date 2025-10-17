"use client"

import { type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, MessageCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
// убрали react-hot-toast, оставляем простое уведомление через alert

interface PaymentDialogProps {
  priceRub: number | null;
  children: ReactNode;
  title?: string;
  tool: {
    id?: string;
    _id?: string;
    name?: string;
    description?: string | null;
    url?: string | null;
  };
}

export function PaymentDialog({ priceRub, children, title, tool }: PaymentDialogProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isSignedIn = !!session?.user

  const toolId = tool?.id || tool?._id;
  const normalizedPrice = typeof priceRub === "number" && Number.isFinite(priceRub) ? Math.max(priceRub, 0) : null;
  const priceLabel = normalizedPrice !== null ? `${normalizedPrice.toLocaleString("ru-RU")} ₽` : "Бесплатно";

  const handleWebsitePayment = () => {
    if (!isSignedIn) {
      alert('Для оплаты на сайте необходимо авторизоваться');
      router.push('/auth/login')
      return;
    }
    if (!toolId) {
      alert('Ошибка: ID инструмента не найден');
      return;
    }
    const params = new URLSearchParams({ toolId: String(toolId) });
    if (normalizedPrice !== null) params.set('priceRub', String(normalizedPrice));
    if (typeof tool?.name === 'string' && tool.name.trim()) params.set('toolName', tool.name.trim());
    router.push(`/payment?${params.toString()}`);
  }

  const handleTelegramPayment = () => {
    const payloadParts: string[] = [];
    if (toolId) payloadParts.push(`tool=${toolId}`);
    if (normalizedPrice !== null) payloadParts.push(`price=${normalizedPrice}`);
    const startParam = payloadParts.length ? `?start=${encodeURIComponent(payloadParts.join('|'))}` : '';
    window.open(`https://t.me/aibazaru${startParam}`, "_blank")
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Оплата {tool.name}</AlertDialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {tool.description}
          </p>
          <p className="text-sm font-medium text-primary mt-1">
            Стоимость: {priceLabel}
          </p>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button 
            onClick={handleTelegramPayment}
            className="h-14 text-base bg-blue-600 hover:bg-blue-700 transition-colors justify-start"
            size="lg"
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={20} />
              <div className="text-left">
                <div>Оплатить через Telegram</div>
                <div className="text-sm opacity-80 font-normal">Чат с менеджером</div>
              </div>
            </div>
          </Button>
          
          <div>
            {!isSignedIn && (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm mb-2">
                <AlertTriangle size={16} />
                <span>Для оплаты на сайте необходимо авторизоваться</span>
              </div>
            )}
            <Button 
              onClick={handleWebsitePayment}
              variant="outline"
              className="h-14 text-base border-2 hover:bg-primary/5 transition-colors justify-start text-primary border-primary/20 w-full"
              size="lg"
              disabled={!isSignedIn}
            >
              <div className="flex items-center gap-3">
                <ExternalLink size={20} />
                <div className="text-left">
                  <div>Оплатить на сайте</div>
                  <div className="text-sm opacity-80 font-normal">Обработка заявки займет до 24 часов</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="w-full">Отмена</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
