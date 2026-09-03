import type { Metadata } from "next";

import { CommunityFeed } from "@/components/community/CommunityFeed";
import { getCommunityFeed } from "@/lib/community-feed";
import { communityFeedTypes, type CommunityFeedType } from "@/lib/community-types";

export const metadata: Metadata = {
  title: "Сообщество AI Bazar — статьи и новые AI-ресурсы",
  description: "Единая лента новых AI-инструментов, MCP-серверов, промптов, навыков, репозиториев и статей сообщества AI Bazar.",
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
