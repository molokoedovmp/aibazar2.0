"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
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
  const accountLabel = session ? "Кабинет" : "Войти";

  const items: MobileNavItem[] = [
    { href: "/", label: "Главная", icon: Home, active: pathname === "/" },
    {
      href: "/catalog",
      label: "AI-библиотека",
      icon: BrainCircuit,
      active: pathname.startsWith("/catalog"),
    },
    {
      href: "/calculator",
      label: "Расчёт",
      icon: Calculator,
      active: pathname.startsWith("/calculator"),
    },
    {
      href: "/blog",
      label: "Сообщество",
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
      label: accountLabel,
      icon: UserRound,
      active:
        pathname.startsWith("/account") ||
        (!session && pathname.startsWith("/auth/login")),
    },
  ];

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-[70] md:hidden"
    >
      {/* Одна общая стеклянная плашка для всех иконок */}
      <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <motion.ul
          layout
          className="mx-auto flex max-w-md items-center justify-between rounded-2xl border border-white/10 bg-black/80 px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/60"
          transition={{ layout: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const labelVisible = item.active;

            return (
              <motion.li
                key={item.href}
                layout
                className="min-w-0"
                transition={{ layout: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } }}
              >
                <Link
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={[
                    "flex h-10 items-center justify-center rounded-xl px-2 transition-all duration-300",
                    item.active
                      ? "border border-white/25 bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                      : "border border-transparent text-white/55 hover:text-white/85 active:text-white",
                  ].join(" ")}
                >
                  <span className="flex items-center">
                    <Icon className="h-[21px] w-[21px] shrink-0" strokeWidth={2} aria-hidden />
                    <AnimatePresence initial={false}>
                      {labelVisible && (
                        <motion.span
                          key="label"
                          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                          animate={{ width: "auto", opacity: 1, marginLeft: 7 }}
                          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                          className="whitespace-nowrap text-[13px] font-semibold leading-none tracking-tight"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </nav>
  );
}
