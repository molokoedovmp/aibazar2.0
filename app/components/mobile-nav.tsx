"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BrainCircuit,
  Calculator,
  Home,
  Info,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type MobileNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

export function MobileNav() {
  const { data: session } = useSession();
  const pathname = usePathname() ?? "";
  const accountHref = session ? "/account" : "/auth/login";
  const items: MobileNavItem[] = [
    { href: "/", label: "Главная", icon: Home, active: pathname === "/" },
    {
      href: "/catalog",
      label: "Каталог",
      icon: BrainCircuit,
      active: pathname.startsWith("/catalog"),
    },
    {
      href: "/calculator",
      label: "Расчёт",
      icon: Calculator,
      active: pathname.startsWith("/calculator") || pathname.startsWith("/payment-instructions"),
    },
    {
      href: "/blog",
      label: "Лента",
      icon: Users,
      active: pathname.startsWith("/blog"),
    },
    {
      href: "/about",
      label: "О нас",
      icon: Info,
      active: pathname.startsWith("/about"),
    },
    {
      href: accountHref,
      label: session ? "Кабинет" : "Войти",
      icon: UserRound,
      active: pathname.startsWith("/account") || pathname.startsWith("/auth"),
    },
  ];

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-[70] flex justify-center md:hidden"
    >
      <div className="w-[calc(100vw-1rem)] max-w-[520px] pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <ul className="mobile-nav-surface flex w-full items-center gap-0.5 rounded-[28px] border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.href} className={item.active ? "min-w-0 flex-[2]" : "min-w-0 flex-1"}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={item.active ? "page" : undefined}
                  className={`flex h-14 items-center justify-center gap-2 rounded-[22px] text-[13px] font-semibold transition-all ${
                    item.active
                      ? "w-full bg-[#202023] px-2 text-white dark:!bg-white dark:!text-black"
                      : "w-full text-black/45 hover:bg-black/[0.05] hover:text-black dark:text-white/50 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className="h-[22px] w-[22px] shrink-0"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  {item.active ? <span className="whitespace-nowrap max-[359px]:hidden">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
