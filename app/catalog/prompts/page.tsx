import type { Metadata } from "next";

import CatalogPage from "../page";

const title = "Промпты для нейросетей — каталог готовых AI-промптов";
const description =
  "Каталог готовых промптов для ChatGPT, Claude и других нейросетей: тексты, маркетинг, анализ, программирование и рабочие задачи. Ищите, открывайте и копируйте подходящие инструкции.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "промпты для нейросетей",
    "каталог промптов",
    "готовые AI промпты",
    "промпты ChatGPT",
    "промпты Claude",
  ],
  alternates: { canonical: "/catalog/prompts" },
  openGraph: {
    title,
    description,
    url: "/catalog/prompts",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function PromptsCatalogPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: "https://ai-bazar.ru/catalog/prompts",
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
