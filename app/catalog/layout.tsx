import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Каталог нейросетей и библиотека AI-инструментов",
  description:
    "Каталог нейросетей и AI-инструментов с поиском по задачам, описаниями и рейтингами. Изучайте MCP-серверы, промпты, навыки агентов и open-source репозитории.",
  keywords: [
    "каталог нейросетей",
    "AI-инструменты",
    "библиотека искусственного интеллекта",
    "MCP каталог",
    "промпты",
  ],
  alternates: { canonical: "/catalog" },
  openGraph: {
    title: "Каталог нейросетей и библиотека AI-инструментов",
    description: "Большая подборка AI-ресурсов с категориями, описаниями и рейтингами.",
    url: "/catalog",
  },
};

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children;
}
