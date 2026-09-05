import type { Metadata } from "next";

import CatalogPage from "../page";

const title = "AI-репозитории GitHub — каталог open-source проектов";
const description =
  "Каталог популярных AI-репозиториев GitHub: агенты, библиотеки, нейросети и инструменты разработки с описаниями, языками и количеством звёзд.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "AI репозитории GitHub",
    "open source AI",
    "каталог AI проектов",
    "нейросети GitHub",
    "AI библиотеки",
  ],
  alternates: { canonical: "/catalog/repos" },
  openGraph: {
    title,
    description,
    url: "/catalog/repos",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function RepositoriesCatalogPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: "https://ai-bazar.ru/catalog/repos",
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
