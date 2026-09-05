import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { LibraryResourceDetail } from "@/components/library/LibraryResourceDetail";
import { prisma } from "@/lib/db";

type PageProps = { params: Promise<{ id: string }> };

const getPrompt = cache((id: string) =>
  prisma.promptResource.findFirst({ where: { id, isActive: true, isPublic: true } }),
);

function shortDescription(value: string | null, fallback: string) {
  const normalized = value?.replace(/\s+/g, " ").trim() || fallback;
  return normalized.length <= 158 ? normalized : `${normalized.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const prompt = await getPrompt(id);
  if (!prompt) return { title: "Промпт не найден", robots: { index: false } };

  const title = prompt.titleRu || prompt.title;
  const description = shortDescription(prompt.descriptionRu || prompt.description, `${title} — готовый промпт для нейросетей с полным текстом и описанием применения.`);
  const canonical = `/catalog/prompts/${encodeURIComponent(prompt.id)}`;
  const image = prompt.coverImages[0];

  return {
    title: `${title} — готовый промпт для нейросетей`,
    description,
    keywords: [title, `${title} промпт`, "готовый промпт", "промпты для нейросетей", ...prompt.tags.slice(0, 4)],
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical, images: image ? [{ url: image, alt: title }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const prompt = await getPrompt(id);
  if (!prompt) notFound();

  const title = prompt.titleRu || prompt.title;
  const description = prompt.descriptionRu || prompt.description || "Готовый промпт для работы с нейросетью.";
  const canonicalUrl = `https://ai-bazar.ru/catalog/prompts/${encodeURIComponent(prompt.id)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: shortDescription(description, `${title} — готовый промпт.`),
    url: canonicalUrl,
    text: prompt.content,
    keywords: prompt.tags.join(", "),
    ...(prompt.authorName ? { author: { "@type": "Person", name: prompt.authorName } } : {}),
    ...(prompt.coverImages[0] ? { image: prompt.coverImages } : {}),
  };

  return (
    <LibraryResourceDetail
      id={prompt.id}
      type="prompts"
      title={title}
      description={description}
      coverImages={prompt.coverImages}
      badges={[prompt.sourceKind, ...prompt.tags.slice(0, 3)]}
      stats={[
        { label: "Рейтинг", value: prompt.rating > 0 ? String(prompt.rating) : "—", kind: "stars" },
        { label: "Голосов", value: prompt.votesCount.toLocaleString("ru-RU"), kind: "type" },
        { label: "Автор", value: prompt.authorName || "Сообщество", kind: "author" },
        { label: "Добавлено", value: formatDate(prompt.createdAt), kind: "date" },
      ]}
      details={[
        { label: "Источник", value: prompt.sourceKind },
        { label: "Автор", value: prompt.authorName || "Не указан" },
        { label: "Статус", value: prompt.status || "Опубликован" },
        { label: "Обновлено", value: formatDate(prompt.updatedAt) },
      ]}
      tags={prompt.tags}
      content={prompt.content}
      contentTitle="Текст промпта"
      externalUrl={prompt.sourceUrl}
      externalLabel="Открыть источник"
      sourceUrl={prompt.sourceUrl}
      structuredData={structuredData}
    />
  );
}
