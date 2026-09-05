import type { Metadata } from "next";

import { CommunityFeed } from "@/components/community/CommunityFeed";
import { getCommunityFeed } from "@/lib/community-feed";
import { communityFeedTypes, type CommunityFeedType } from "@/lib/community-types";

export const metadata: Metadata = {
  title: "Новые AI-инструменты, MCP и статьи сообщества",
  description: "Лента новых нейросетей, AI-инструментов, MCP-серверов, промптов, навыков, репозиториев и полезных статей из библиотеки aiBazar.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Новые AI-инструменты, MCP и статьи сообщества",
    description: "Следите за обновлениями большой библиотеки AI-ресурсов и читайте практические материалы.",
    url: "/blog",
  },
};

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const params = await searchParams;
  const initialType = communityFeedTypes.includes(params.type as CommunityFeedType)
    ? params.type as CommunityFeedType
    : "all";
  const initialQuery = params.q?.trim() || "";
  const initialData = await getCommunityFeed({ type: initialType, query: initialQuery, page: 1, limit: 12 });

  return <CommunityFeed initialData={initialData} initialType={initialType} initialQuery={initialQuery} />;
}
