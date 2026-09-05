import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { LibraryResourceDetail } from "@/components/library/LibraryResourceDetail";
import { prisma } from "@/lib/db";
import { getGitHubReadme } from "@/lib/github-readme";

type PageProps = { params: Promise<{ id: string }> };

const getRepository = cache((id: string) =>
  prisma.repositoryResource.findFirst({ where: { id, isActive: true } }),
);

function shortDescription(value: string, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim() || fallback;
  return normalized.length <= 158 ? normalized : `${normalized.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const repository = await getRepository(id);
  if (!repository) return { title: "AI-репозиторий не найден", robots: { index: false } };

  const description = shortDescription(repository.descriptionRu || repository.description, `${repository.name} — open-source AI-проект: описание, язык и ссылка на GitHub.`);
  const canonical = `/catalog/repos/${encodeURIComponent(repository.id)}`;
  const image = repository.coverImages[0];

  return {
    title: `${repository.name} — AI-репозиторий GitHub`,
    description,
    keywords: [repository.name, `${repository.name} GitHub`, "AI репозиторий", "open-source AI", repository.language || "AI проект"],
    alternates: { canonical },
    openGraph: { type: "website", title: `${repository.name} — AI-репозиторий`, description, url: canonical, images: image ? [{ url: image, alt: repository.name }] : undefined },
    twitter: { card: "summary_large_image", title: repository.name, description, images: image ? [image] : undefined },
  };
}

export default async function RepositoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const repository = await getRepository(id);
  if (!repository) notFound();

  const github = await getGitHubReadme(repository.url);
  const description = repository.descriptionRu || repository.description;
  const canonicalUrl = `https://ai-bazar.ru/catalog/repos/${encodeURIComponent(repository.id)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: repository.name,
    description: shortDescription(description, `${repository.name} — AI-репозиторий.`),
    url: canonicalUrl,
    codeRepository: repository.url,
    ...(repository.language ? { programmingLanguage: repository.language } : {}),
    ...(repository.coverImages[0] ? { image: repository.coverImages } : {}),
  };

  return (
    <LibraryResourceDetail
      id={repository.id}
      type="repos"
      title={repository.name}
      description={description}
      coverImages={repository.coverImages}
      badges={[repository.language || "Open source", repository.owner || "GitHub"]}
      stats={[
        { label: "Звёзды GitHub", value: (github?.stars ?? repository.stars)?.toLocaleString("ru-RU") || "—", kind: "stars" },
        { label: "Язык", value: github?.language || repository.language || "Не указан", kind: "type" },
        { label: "Автор", value: github?.author || repository.owner || "Не указан", kind: "author" },
        { label: "Добавлено", value: formatDate(repository.createdAt), kind: "date" },
      ]}
      details={[
        { label: "Владелец", value: github?.author || repository.owner || "Не указан" },
        { label: "Репозиторий", value: repository.repositoryName || repository.name },
        { label: "Язык", value: github?.language || repository.language || "Не указан" },
        { label: "Лицензия", value: github?.license || "Не указана" },
        { label: "Обновлено", value: formatDate(github?.lastUpdated || repository.updatedAt) },
      ]}
      externalUrl={repository.url}
      externalLabel="Открыть GitHub"
      markdown={github?.readme}
      readmeBaseUrl={github?.readmeBaseUrl}
      sourceUrl={repository.sourceUrl}
      structuredData={structuredData}
    />
  );
}
