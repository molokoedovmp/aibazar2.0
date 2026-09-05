import type { Metadata } from "next";

import CatalogPage from "../page";

const title = "AI-навыки для агентов — каталог Skills";
const description =
  "Библиотека AI-навыков и готовых Skills для Claude Code, Codex, Cursor и других агентов. Находите расширения по задаче, изучайте описание и переходите к установке.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "AI навыки",
    "навыки для AI агентов",
    "Claude Code skills",
    "Codex skills",
    "каталог Skills",
  ],
  alternates: { canonical: "/catalog/skills" },
  openGraph: {
    title,
    description,
    url: "/catalog/skills",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function SkillsCatalogPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: "https://ai-bazar.ru/catalog/skills",
    isPartOf: { "@type": "WebSite", name: "aiBazar", url: "https://ai-bazar.ru" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CatalogPage />
    </>
  );
}
