import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { LibraryResourceDetail } from "@/components/library/LibraryResourceDetail";
import { prisma } from "@/lib/db";
import { getGitHubReadme } from "@/lib/github-readme";

type PageProps = { params: Promise<{ id: string }> };

const getSkill = cache((id: string) =>
  prisma.skillResource.findFirst({ where: { id, isActive: true } }),
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
  const skill = await getSkill(id);
  if (!skill) return { title: "AI-навык не найден", robots: { index: false } };

  const description = shortDescription(skill.descriptionRu || skill.description, `${skill.name} — навык для AI-агентов: описание, совместимость и установка.`);
  const canonical = `/catalog/skills/${encodeURIComponent(skill.id)}`;
  const image = skill.coverImages[0];

  return {
    title: `${skill.name} — AI-навык: описание и установка`,
    description,
    keywords: [skill.name, `${skill.name} skill`, "AI-навык", "навыки для AI-агентов", ...skill.compatibleAgents.slice(0, 3)],
    alternates: { canonical },
    openGraph: { type: "website", title: `${skill.name} — AI-навык`, description, url: canonical, images: image ? [{ url: image, alt: skill.name }] : undefined },
    twitter: { card: "summary_large_image", title: skill.name, description, images: image ? [image] : undefined },
  };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { id } = await params;
  const skill = await getSkill(id);
  if (!skill) notFound();

  const github = await getGitHubReadme(skill.repoUrl);
  const description = skill.descriptionRu || skill.description;
  const externalUrl = skill.repoUrl || skill.sourceUrl;
  const canonicalUrl = `https://ai-bazar.ru/catalog/skills/${encodeURIComponent(skill.id)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: skill.name,
    description: shortDescription(description, `${skill.name} — AI-навык.`),
    url: canonicalUrl,
    applicationCategory: "AI Agent Skill",
    operatingSystem: "Cross-platform",
    isAccessibleForFree: true,
    ...(skill.repoUrl ? { codeRepository: skill.repoUrl, sameAs: skill.repoUrl } : {}),
    ...(skill.coverImages[0] ? { image: skill.coverImages } : {}),
  };

  return (
    <LibraryResourceDetail
      id={skill.id}
      type="skills"
      title={skill.name}
      description={description}
      coverImages={skill.coverImages}
      badges={[skill.category || "AI Skill", skill.isOfficial ? "Официальный" : "Сообщество", ...skill.compatibleAgents.slice(0, 2)]}
      stats={[
        { label: "Звёзды GitHub", value: (github?.stars ?? skill.stars)?.toLocaleString("ru-RU") || "—", kind: "stars" },
        { label: "Язык", value: github?.language || skill.sourceLanguage || "Не указан", kind: "type" },
        { label: "Автор", value: github?.author || skill.author || "Сообщество", kind: "author" },
        { label: "Добавлено", value: formatDate(skill.createdAt), kind: "date" },
      ]}
      details={[
        { label: "Категория", value: skill.category || "Не указана" },
        { label: "Автор", value: github?.author || skill.author || "Не указан" },
        { label: "Лицензия", value: github?.license || "Не указана" },
        { label: "Совместимость", value: skill.compatibleAgents.join(", ") || "Не указана" },
        { label: "Статус", value: skill.isOfficial ? "Официальный" : skill.status || "Сообщество" },
        { label: "Обновлено", value: formatDate(github?.lastUpdated || skill.updatedAt) },
      ]}
      tags={skill.tags}
      installCommand={skill.installCommand}
      markdown={github?.readme}
      readmeBaseUrl={github?.readmeBaseUrl}
      externalUrl={externalUrl}
      externalLabel={skill.repoUrl ? "Открыть GitHub" : "Открыть источник"}
      sourceUrl={skill.sourceUrl}
      structuredData={structuredData}
    />
  );
}
