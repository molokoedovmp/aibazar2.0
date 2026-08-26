import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI-инструменты — aiBazar",
  description: "Каталог AI-инструментов и нейросетей для работы, творчества и бизнеса.",
};

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children;
}
