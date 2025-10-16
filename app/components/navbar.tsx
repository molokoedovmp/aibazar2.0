"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Home, Grid2X2, Briefcase, Users, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
            ? "absolute inset-x-0 top-0 z-50 bg-transparent"
            : "border-b border-white/15 bg-black",
        ].join(" ")}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-10">
          {/* Брендинг */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="AI Bazar" width={40} height={40} className="rounded" />
              <span className="text-lg font-semibold tracking-tight">aibazar</span>
            </Link>
          </div>

          {/* Главное меню — просто ссылки */}
          <nav className="ml-6 flex items-center gap-6 lg:gap-8">
            <Link href="/catalog" className="text-sm font-medium hover:opacity-80">
              Каталог
            </Link>
            <Link href="/services" className="text-sm font-medium hover:opacity-80">
              Услуги
            </Link>
            <Link href="/blog" className="text-sm hover:opacity-80">
              Сообщество
            </Link>
            <Link href="/about" className="text-sm hover:opacity-80">
              О нас
            </Link>
          </nav>

          {/* Правый блок */}
          <div className="flex items-center gap-4">
            {!session ? (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-white/30 text-black hover:bg-white/10 hover:text-white">
                    Вход
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-white text-black hover:bg-white/90">
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

      {/* Нижняя мобильная панель (тёмная) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/85 text-white backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <ul className="mx-auto grid max-w-3xl grid-cols-5 px-2 py-2 text-xs">
          <li>
            <Link href="/" className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-white/10">
              <Home className="h-5 w-5" />
              <span>Главная</span>
            </Link>
          </li>
          <li>
            <Link href="/catalog" className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-white/10">
              <Grid2X2 className="h-5 w-5" />
              <span>Каталог</span>
            </Link>
          </li>
          <li>
            <Link href="/services" className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-white/10">
              <Briefcase className="h-5 w-5" />
              <span>Услуги</span>
            </Link>
          </li>
          <li>
            <Link href="/blog" className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-white/10">
              <Users className="h-5 w-5" />
              <span>Сообщество</span>
            </Link>
          </li>
          <li>
            <Link
              href={session ? "/account" : "/auth/login"}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-white/10"
            >
              <UserIcon className="h-5 w-5" />
              <span>{session ? "Кабинет" : "Войти"}</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Отступ под фиксированную мобильную панель */}
      <style jsx global>{`
        @media (max-width: 767px) {
          :root { --mobile-bar-h: 56px; }
          body { padding-bottom: calc(var(--mobile-bar-h) + env(safe-area-inset-bottom)); }
        }
      `}</style>
    </>
  );
};
