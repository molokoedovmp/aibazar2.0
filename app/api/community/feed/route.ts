import { NextRequest, NextResponse } from "next/server";

import { getCommunityFeed } from "@/lib/community-feed";
import { communityFeedTypes, type CommunityFeedType } from "@/lib/community-types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestedType = request.nextUrl.searchParams.get("type") || "all";
  const type = communityFeedTypes.includes(requestedType as CommunityFeedType)
    ? requestedType as CommunityFeedType
    : "all";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 12);
  const query = request.nextUrl.searchParams.get("q") || "";

  try {
    return NextResponse.json(await getCommunityFeed({ type, page, limit, query }));
  } catch (error) {
    console.error("Community feed error:", error);
    return NextResponse.json({ error: "Не удалось загрузить ленту" }, { status: 500 });
  }
}
