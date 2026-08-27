import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI-библиотека — aiBazar",
  description:
    "AI-инструменты, MCP-серверы, промпты, навыки агентов и open-source репозитории.",
};

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children;
}
