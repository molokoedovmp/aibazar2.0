export const communityFeedTypes = ["all", "articles", "tools", "mcp", "prompts", "skills", "repos"] as const;

export type CommunityFeedType = (typeof communityFeedTypes)[number];
export type CommunityResourceType = Exclude<CommunityFeedType, "all">;

export type CommunityFeedCounts = Record<CommunityResourceType, number>;

export type CommunityFeedItem = {
  id: string;
  type: CommunityResourceType;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  coverImage?: string | null;
  coverImages: string[];
  author?: string | null;
  category?: string | null;
  tags: string[];
  rating?: number | null;
  stars?: number | null;
  views?: number | null;
  readTime?: number | null;
  isOfficial?: boolean;
  detailContent?: string | null;
  installCommand?: string | null;
  externalUrl?: string | null;
};

export type CommunityFeedResponse = {
  success: true;
  data: CommunityFeedItem[];
  counts: CommunityFeedCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};
