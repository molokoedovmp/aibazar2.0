import { Button } from "@/components/ui/button";
import { Instagram, Send } from "lucide-react";
import Link from "next/link";
import { YandexZenIcon } from "@/components/YandexZenIcon";

export const Footer = () => {
  return (
    <div className="flex items-center w-full p-6 bg-background z-50 dark:bg-[#1F1F1F]">
      <div className="md:ml-auto w-full justify-between md:justify-end flex flex-col md:flex-row items-center gap-4 md:gap-x-2 text-muted-foreground">
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="flex items-center gap-2">
            <Link href="https://www.instagram.com/aibazaru/" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://t.me/aiBazar1" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://dzen.ru/aibazar?share_to=link" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <YandexZenIcon className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <Link href="/legal/user-agreement">
              <Button variant="ghost" size="sm" className="whitespace-nowrap">Пользовательское соглашение</Button>
            </Link>
            <Link href="/legal/terms">
              <Button variant="ghost" size="sm" className="whitespace-nowrap">Правила и условия</Button>
            </Link>
            <Link href="/legal/privacy">
              <Button variant="ghost" size="sm" className="whitespace-nowrap">Политика конфиденциальности</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
