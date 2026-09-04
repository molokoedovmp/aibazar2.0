"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "./mobile-nav";

type Props = { overlay?: boolean };

export const Navbar = ({ overlay = false }: Props) => {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Гость";
  const userImage = session?.user?.image || "";

  return (
    <>
      {/* ПК-версия (обычная, не прилипает) */}
      <header
        className={[
          "hidden md:block h-16 text-white relative",
          overlay
            ? "absolute inset-x-0 top-0 z-50 border-b border-white/15 bg-black"
            : "border-b border-white/15 bg-black",
        ].join(" ")}
      >
        <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center px-4 lg:px-6">
          {/* Брендинг */}
          <div className="flex items-center gap-3 justify-self-start">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="AI Bazar" width={40} height={40} className="rounded" />
              <span className="text-lg font-semibold tracking-tight">aibazar</span>
            </Link>
          </div>

          {/* Главное меню — просто ссылки */}
          <nav className="flex items-center gap-6 justify-self-center lg:gap-8">
            <Link href="/catalog" className="text-sm font-medium hover:opacity-80">
              AI-библиотека
            </Link>
            <Link href="/calculator" className="text-sm font-medium hover:opacity-80">
              Калькулятор цен
            </Link>
            <Link href="/blog" className="text-sm hover:opacity-80">
              Сообщество
            </Link>
            <Link href="/about" className="text-sm hover:opacity-80">
              О нас
            </Link>
          </nav>

          {/* Правый блок */}
          <div className="flex items-center gap-4 justify-self-end">
            <ThemeToggle />
            {!session ? (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    Вход
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="navbar-light-button bg-white text-black hover:bg-white/90">
                    Регистрация
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/account">
                  <Button variant="ghost" className="text-white ">
                    Личный кабинет
                  </Button>
                </Link>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userImage} alt={userName} />
                  <AvatarFallback className="bg-white/10 text-white">
                    {userName[0]}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        </div>
        {/* Тонкий разделитель в режиме overlay, чтобы сохранить визуальный separator */}
        {overlay && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/15" />
        )}
      </header>

      {/* Нижняя мобильная панель — стеклянные плитки (иконки, текст раскрывается при выборе) */}
      <MobileNav />

      {/* Отступ под фиксированную мобильную панель добавляет сам footer */}
      <style jsx global>{`
        @media (max-width: 767px) {
          :root { --mobile-bar-h: 66px; }
        }
      `}</style>
    </>
  );
};
