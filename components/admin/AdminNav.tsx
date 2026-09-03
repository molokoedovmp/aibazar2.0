"use client";

import Link from "next/link";
import { BookOpenText, Bot, Boxes, FileText, Github, LayoutDashboard, ShoppingBag, Sparkles, Users } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { href: "/account/admin/tools", label: "AI-инструменты", icon: Boxes },
  { href: "/account/admin/mcp", label: "MCP", icon: Bot },
  { href: "/account/admin/prompts", label: "Промпты", icon: BookOpenText },
  { href: "/account/admin/skills", label: "Навыки", icon: Sparkles },
  { href: "/account/admin/repos", label: "Репозитории", icon: Github },
  { href: "/account/admin/documents", label: "Документы", icon: FileText },
  { href: "/account/admin/users", label: "Пользователи", icon: Users },
  { href: "/account/admin/orders", label: "Заказы", icon: ShoppingBag },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Разделы админки" className="mt-6 flex gap-2 overflow-x-auto border-b border-black/10 pb-3 dark:border-white/10">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={active
              ? "inline-flex shrink-0 items-center gap-2 rounded-full border border-black bg-black px-4 py-2 text-sm font-medium text-white dark:border-white dark:bg-white dark:text-black"
              : "inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:border-black/30 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/30"
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
