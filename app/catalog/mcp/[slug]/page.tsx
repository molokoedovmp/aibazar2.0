import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, CalendarDays, ExternalLink, Github, MapPin, ShieldCheck, Star } from "lucide-react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { ToolImage } from "@/app/components/ToolImage";
import { prisma } from "@/lib/db";
import { McpMarkdownDescription } from "./mcp-markdown-description";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type GitHubDetails = {
  author: string | null;
  language: string | null;
  lastUpdated: Date | null;
  license: string | null;
  readme: string | null;
  readmeBaseUrl: string | null;
  stars: number | null;
};

type GitHubRepositoryResponse = {
  default_branch?: string;
  language?: string | null;
  license?: { name?: string | null } | null;
  owner?: { login?: string | null } | null;
  pushed_at?: string | null;
  stargazers_count?: number | null;
};

function formatCompact(value: number | null) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatAdded(value: Date | null) {
  if (!value) return "—";
  return value.toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
}

function formatDate(value: Date | null) {
  if (!value) return "—";
  return value.toLocaleDateString("ru-RU");
}

const getMcp = cache(async (slug: string) => {
  return prisma.mcpResource.findFirst({
    where: { slug, isActive: true },
  });
});

function parseGitHubRepository(githubUrl: string | null) {
  if (!githubUrl) return null;

  try {
    const url = new URL(githubUrl);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    const [owner, rawRepository] = url.pathname.split("/").filter(Boolean);
    const repository = rawRepository?.replace(/\.git$/i, "");
    if (!owner || !repository) return null;
    return { owner, repository };
  } catch {
    return null;
  }
}

async function safeFetch(url: string, headers?: HeadersInit) {
  try {
    return await fetch(url, {
      headers,
      next: { revalidate: 21_600 },
    });
  } catch {
    return null;
  }
}

const getGitHubDetails = cache(async (githubUrl: string | null): Promise<GitHubDetails | null> => {
  const repository = parseGitHubRepository(githubUrl);
  if (!repository) return null;

  const { owner, repository: repositoryName } = repository;
  const encodedOwner = encodeURIComponent(owner);
  const encodedRepository = encodeURIComponent(repositoryName);
  const apiHeaders: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aiBazar MCP catalog",
  };
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  if (githubToken) apiHeaders.Authorization = `Bearer ${githubToken}`;

  const rawBase = `https://raw.githubusercontent.com/${encodedOwner}/${encodedRepository}`;
  const [repositoryResponse, masterReadmeResponse, mainReadmeResponse] = await Promise.all([
    safeFetch(`https://api.github.com/repos/${encodedOwner}/${encodedRepository}`, apiHeaders),
    safeFetch(`${rawBase}/master/README.md`),
    safeFetch(`${rawBase}/main/README.md`),
  ]);

  let repositoryData: GitHubRepositoryResponse | null = null;
  if (repositoryResponse?.ok) {
    repositoryData = (await repositoryResponse.json()) as GitHubRepositoryResponse;
  }

  let readmeResponse = masterReadmeResponse?.ok
    ? masterReadmeResponse
    : mainReadmeResponse?.ok
      ? mainReadmeResponse
      : null;
  let readmeBranch = masterReadmeResponse?.ok ? "master" : mainReadmeResponse?.ok ? "main" : null;

  const defaultBranch = repositoryData?.default_branch;
  if (!readmeResponse && defaultBranch && defaultBranch !== "master" && defaultBranch !== "main") {
    const defaultReadmeResponse = await safeFetch(
      `${rawBase}/${encodeURIComponent(defaultBranch)}/README.md`,
    );
    if (defaultReadmeResponse?.ok) {
      readmeResponse = defaultReadmeResponse;
      readmeBranch = defaultBranch;
    }
  }

  const pushedAt = repositoryData?.pushed_at ? new Date(repositoryData.pushed_at) : null;

  return {
    author: repositoryData?.owner?.login || null,
    language: repositoryData?.language || null,
    lastUpdated: pushedAt && !Number.isNaN(pushedAt.getTime()) ? pushedAt : null,
    license: repositoryData?.license?.name || null,
    readme: readmeResponse ? await readmeResponse.text() : null,
    readmeBaseUrl: readmeBranch ? `${rawBase}/${encodeURIComponent(readmeBranch)}/` : null,
    stars:
      typeof repositoryData?.stargazers_count === "number"
        ? repositoryData.stargazers_count
        : null,
  };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const mcp = await getMcp(slug);
  if (!mcp) return { title: "MCP не найден — aiBazar" };

  return {
    title: `${mcp.name} — MCP — aiBazar`,
    description: mcp.descriptionRu || mcp.description,
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(90px,0.8fr)_minmax(0,1.2fr)] gap-4 border-b border-black/8 py-3 last:border-0">
      <dt className="text-sm text-black/45">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium text-black">{value}</dd>
    </div>
  );
}

export default async function McpDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const mcp = await getMcp(slug);
  if (!mcp) notFound();

  const githubDetails = await getGitHubDetails(mcp.githubUrl);
  const sourceMarkdown = githubDetails?.readme || mcp.longDescription || mcp.documentation || mcp.description;
  let initialMarkdown =
    mcp.longDescription === sourceMarkdown && mcp.longDescriptionRu
      ? mcp.longDescriptionRu
      : sourceMarkdown === mcp.description && mcp.descriptionRu
        ? mcp.descriptionRu
        : null;

  if (sourceMarkdown !== mcp.description && mcp.longDescription !== sourceMarkdown) {
    await prisma.mcpResource.update({
      where: { id: mcp.id },
      data: { longDescription: sourceMarkdown, longDescriptionRu: null },
    });
    initialMarkdown = null;
  }
  const externalUrl = mcp.githubUrl || mcp.websiteUrl;
  const status = mcp.isOfficial ? "Официальный" : "Сообщество";
  const language = githubDetails?.language || mcp.languageName;
  const stars = githubDetails?.stars ?? mcp.stars;
  const author = githubDetails?.author || mcp.author;
  const license = githubDetails?.license || mcp.license;
  const lastUpdated = githubDetails?.lastUpdated || mcp.sourceUpdatedAt;

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-black">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/catalog?type=mcp"
          className="inline-flex items-center gap-2 text-sm text-black/55 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к MCP
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
          <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <ToolImage
              src={null}
              alt={mcp.name}
              className="h-56 w-full object-cover sm:h-72 lg:h-full lg:min-h-[380px]"
              fallbackTextClassName="px-8 text-3xl sm:text-5xl"
            />

            <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap gap-2">
                {language && (
                  <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium">
                    {mcp.languageIcon ? `${mcp.languageIcon} ` : ""}{language}
                  </span>
                )}
                <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium">
                  {mcp.resourceType}
                </span>
                {mcp.categoryNames.slice(0, 2).map((category) => (
                  <span key={category} className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium">
                    {category}
                  </span>
                ))}
                {mcp.location && (
                  <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium">
                    {mcp.location}
                  </span>
                )}
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-black/35">Каталог MCP</p>
              <h1 className="mt-2 break-words text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
                {mcp.name}
              </h1>
              <p className="mt-5 line-clamp-4 text-sm leading-7 text-black/55 sm:text-base">
                {mcp.descriptionRu || mcp.description}
              </p>

              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/85 sm:w-fit"
                >
                  {mcp.githubUrl ? <Github className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  {mcp.githubUrl ? "Открыть GitHub" : "Открыть сайт"}
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
            <Star className="h-4 w-4 text-black/35" />
            <div className="mt-4 text-2xl font-semibold">{mcp.rating?.toFixed(1) || "—"}</div>
            <div className="mt-1 text-xs text-black/45">Рейтинг</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
            <Github className="h-4 w-4 text-black/35" />
            <div className="mt-4 text-2xl font-semibold">{formatCompact(stars)}</div>
            <div className="mt-1 text-xs text-black/45">Звёзды GitHub</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
            <CalendarDays className="h-4 w-4 text-black/35" />
            <div className="mt-4 text-2xl font-semibold">{formatAdded(mcp.sourceCreatedAt)}</div>
            <div className="mt-1 text-xs text-black/45">Добавлено</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
            <ShieldCheck className="h-4 w-4 text-black/35" />
            <div className="mt-4 text-2xl font-semibold">{status}</div>
            <div className="mt-1 text-xs text-black/45">Статус</div>
          </div>
        </section>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Описание</h2>
            <div className="mt-6">
              <McpMarkdownDescription
                slug={mcp.slug}
                initialMarkdown={initialMarkdown}
                fallbackMarkdown={sourceMarkdown}
                readmeBaseUrl={githubDetails?.readmeBaseUrl || null}
              />
            </div>

            {mcp.tags.length > 0 && (
              <div className="mt-8 border-t border-black/10 pt-6">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">Теги</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mcp.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-black/5 px-3 py-1.5 text-xs text-black/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="h-fit rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-5">
            <h2 className="text-lg font-semibold">Краткая информация</h2>
            <dl className="mt-3">
              <InfoRow label="Автор" value={author || "Неизвестно"} />
              <InfoRow label="Язык" value={language || "Неизвестно"} />
              <InfoRow label="Тип" value={mcp.resourceType} />
              <InfoRow label="Расположение" value={mcp.location || "Неизвестно"} />
              <InfoRow label="Лицензия" value={license || "Неизвестно"} />
              <InfoRow label="Обновлено" value={formatDate(lastUpdated)} />
            </dl>

            <div className="mt-5 rounded-2xl bg-black/[0.03] p-4 text-xs leading-5 text-black/50">
              <div className="flex items-center gap-2 font-medium text-black/70">
                <MapPin className="h-3.5 w-3.5" />
                Источник данных
              </div>
              <a
                href={mcp.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block break-words underline"
              >
                collective-ai-tools
              </a>
            </div>
          </aside>
        </div>
      </main>

      <div className="border-t border-black/10 bg-white">
        <Footer />
      </div>
    </div>
  );
}
