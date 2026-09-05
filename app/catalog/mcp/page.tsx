import type { Metadata } from "next";

import CatalogPage from "../page";

const title = "MCP-серверы — каталог Model Context Protocol";
const description =
  "Каталог MCP-серверов для Claude, Cursor и AI-агентов. Находите интеграции с API, базами данных, файлами и рабочими сервисами по описанию, рейтингу и звёздам GitHub.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "MCP серверы",
    "каталог MCP",
    "Model Context Protocol",
    "MCP Claude",
    "MCP Cursor",
  ],
  alternates: { canonical: "/catalog/mcp" },
  openGraph: {
    title,
    description,
    url: "/catalog/mcp",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function McpCatalogPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: "https://ai-bazar.ru/catalog/mcp",
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
