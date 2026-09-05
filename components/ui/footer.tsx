import type React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type FooterLink = {
  title: string;
  href: string;
  external?: boolean;
};

type FooterProps = React.ComponentProps<"footer">;

const columns: Array<{
  featured: FooterLink;
  title: string;
  links: FooterLink[];
}> = [
  {
    featured: { title: "Telegram", href: "https://t.me/aiBazar1", external: true },
    title: "Разделы",
    links: [
      { title: "AI-библиотека", href: "/catalog" },
      { title: "Калькулятор цен", href: "/calculator" },
      { title: "Сообщество", href: "/blog" },
      { title: "О нас", href: "/about" },
    ],
  },
  {
    featured: {
      title: "Instagram",
      href: "https://www.instagram.com/aibazaru/",
      external: true,
    },
    title: "Каталог",
    links: [
      { title: "AI-инструменты", href: "/catalog?type=tools" },
      { title: "MCP-серверы", href: "/catalog/mcp" },
      { title: "Промпты", href: "/catalog/prompts" },
      { title: "Навыки", href: "/catalog/skills" },
      { title: "Репозитории", href: "/catalog/repos" },
    ],
  },
  {
    featured: {
      title: "Дзен",
      href: "/out/dzen",
      external: true,
    },
    title: "Помощь",
    links: [
      { title: "Помощь с оплатой", href: "/calculator" },
      { title: "Как проходит оплата", href: "/payment-instructions" },
      { title: "Личный кабинет", href: "/account" },
      { title: "Обратиться в Telegram", href: "https://t.me/aiBazar1", external: true },
    ],
  },
  {
    featured: { title: "Главная", href: "/" },
    title: "Документы",
    links: [
      { title: "Пользовательское соглашение", href: "/legal/user-agreement" },
      { title: "Правила и условия", href: "/legal/terms" },
      { title: "Политика конфиденциальности", href: "/legal/privacy" },
    ],
  },
];

export function Footer({ className, ...props }: FooterProps) {
  return (
    <footer
      className={cn(
        "relative z-10 border-t border-black/10 bg-transparent dark:border-white/10",
        className,
      )}
      {...props}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="relative grid grid-cols-1 border-x border-black/10 dark:border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-black/10 dark:sm:divide-white/10 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <FeaturedLink link={column.featured} />
              <LinksGroup title={column.title} links={column.links} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center border-t border-black/10 px-4 pb-[calc(var(--mobile-bar-h,0px)+env(safe-area-inset-bottom)+0.75rem)] pt-3 dark:border-white/10 md:pb-3">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} aiBazar. Все права защищены.
        </p>
      </div>
    </footer>
  );
}

function LinksGroup({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="p-4 sm:min-h-52">
      <h3 className="mb-4 mt-1 text-xs font-medium uppercase tracking-wider text-foreground/55">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.title}>
            <FooterAnchor link={link} className="text-xs text-muted-foreground transition hover:text-foreground" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FeaturedLink({ link }: { link: FooterLink }) {
  return (
    <FooterAnchor
      link={link}
      className="flex items-center justify-between border-y border-black/10 p-4 text-sm transition hover:bg-accent hover:text-accent-foreground dark:border-white/10 sm:border-t-0"
    >
      <span className="font-medium">{link.title}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </FooterAnchor>
  );
}

function FooterAnchor({
  link,
  className,
  children,
}: {
  link: FooterLink;
  className?: string;
  children?: React.ReactNode;
}) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cn("group", className)}>
        {children ?? link.title}
      </a>
    );
  }

  return (
    <Link href={link.href} className={cn("group", className)}>
      {children ?? link.title}
    </Link>
  );
}
