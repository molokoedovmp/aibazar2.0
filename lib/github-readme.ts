import { cache } from "react";

type GitHubRepositoryResponse = {
  default_branch?: string;
  language?: string | null;
  license?: { name?: string | null } | null;
  owner?: { login?: string | null } | null;
  pushed_at?: string | null;
  stargazers_count?: number | null;
};

export type GitHubReadmeDetails = {
  author: string | null;
  language: string | null;
  lastUpdated: Date | null;
  license: string | null;
  readme: string | null;
  readmeBaseUrl: string | null;
  stars: number | null;
};

function parseRepository(urlValue: string | null | undefined) {
  if (!urlValue) return null;
  try {
    const url = new URL(urlValue);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    const [owner, rawRepository] = url.pathname.split("/").filter(Boolean);
    const repository = rawRepository?.replace(/\.git$/i, "");
    return owner && repository ? { owner, repository } : null;
  } catch {
    return null;
  }
}

async function githubFetch(url: string, accept: string) {
  const headers: HeadersInit = {
    Accept: accept,
    "User-Agent": "aiBazar catalog",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(url, { headers, next: { revalidate: 21_600 } });
  } catch {
    return null;
  }
}

export const getGitHubReadme = cache(async (urlValue: string | null | undefined): Promise<GitHubReadmeDetails | null> => {
  const parsed = parseRepository(urlValue);
  if (!parsed) return null;

  const owner = encodeURIComponent(parsed.owner);
  const repository = encodeURIComponent(parsed.repository);
  const apiRoot = `https://api.github.com/repos/${owner}/${repository}`;
  const [repositoryResponse, readmeResponse] = await Promise.all([
    githubFetch(apiRoot, "application/vnd.github+json"),
    githubFetch(`${apiRoot}/readme`, "application/vnd.github.raw+json"),
  ]);

  let repositoryData: GitHubRepositoryResponse | null = null;
  if (repositoryResponse?.ok) repositoryData = (await repositoryResponse.json()) as GitHubRepositoryResponse;

  const pushedAt = repositoryData?.pushed_at ? new Date(repositoryData.pushed_at) : null;
  const branch = repositoryData?.default_branch || "main";

  return {
    author: repositoryData?.owner?.login || parsed.owner,
    language: repositoryData?.language || null,
    lastUpdated: pushedAt && !Number.isNaN(pushedAt.getTime()) ? pushedAt : null,
    license: repositoryData?.license?.name || null,
    readme: readmeResponse?.ok ? await readmeResponse.text() : null,
    readmeBaseUrl: `https://raw.githubusercontent.com/${owner}/${repository}/${encodeURIComponent(branch)}/`,
    stars: typeof repositoryData?.stargazers_count === "number" ? repositoryData.stargazers_count : null,
  };
});
