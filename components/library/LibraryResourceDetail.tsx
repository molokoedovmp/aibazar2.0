import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileCode2,
  Github,
  Layers3,
  Star,
  UserRound,
} from "lucide-react";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { ToolImage } from "@/app/components/ToolImage";
import FavoriteButton from "@/components/FavoriteButton";
import { CopyTextButton } from "@/components/library/CopyTextButton";
import type { LibraryResourceType } from "@/components/library/LibraryResourceCard";
import { MarkdownDescription } from "@/components/library/MarkdownDescription";

type DetailRow = { label: string; value: string };
type DetailStat = { label: string; value: string; kind?: "stars" | "date" | "author" | "type" };

type LibraryResourceDetailProps = {
  id: string;
  type: Exclude<LibraryResourceType, "tools" | "mcp">;
  title: string;
  description: string;
  coverImages: string[];
  badges: string[];
  stats: DetailStat[];
  details: DetailRow[];
  tags?: string[];
  content?: string | null;
  contentTitle?: string;
  installCommand?: string | null;
  markdown?: string | null;
  readmeBaseUrl?: string | null;
  externalUrl?: string | null;
  externalLabel?: string;
  sourceUrl?: string | null;
  structuredData: Record<string, unknown>;
};

const TYPE_CONFIG = {
  prompts: { label: "Каталог промптов", backLabel: "Назад к промптам", href: "/catalog/prompts" },
  skills: { label: "Каталог AI-навыков", backLabel: "Назад к навыкам", href: "/catalog/skills" },
  repos: { label: "Каталог репозиториев", backLabel: "Назад к репозиториям", href: "/catalog/repos" },
} as const;

function StatIcon({ kind }: { kind?: DetailStat["kind"] }) {
  const Icon = kind === "stars" ? Star : kind === "date" ? CalendarDays : kind === "author" ? UserRound : Layers3;
  return <Icon className="h-4 w-4 text-black/35 dark:text-white/35" />;
}

export function LibraryResourceDetail({
  id,
  type,
  title,
  description,
  coverImages,
  badges,
  stats,
  details,
  tags = [],
  content,
  contentTitle = "Содержимое",
  installCommand,
  markdown,
  readmeBaseUrl = null,
  externalUrl,
  externalLabel = "Открыть источник",
  sourceUrl,
  structuredData,
}: LibraryResourceDetailProps) {
  const config = TYPE_CONFIG[type];
  const canonicalPath = `${config.href}/${encodeURIComponent(id)}`;

  return (
    <div className="min-h-screen bg-[#f6f6f3] text-black">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link href={config.href} className="inline-flex items-center gap-2 text-sm text-black/55 transition hover:text-black dark:text-white/55 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {config.backLabel}
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10">
          <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <ToolImage
              src={coverImages[0] || null}
              alt={title}
              className="block h-56 w-full object-cover sm:h-72 lg:h-full lg:min-h-[380px]"
              fallbackTextClassName="px-8 text-3xl sm:text-5xl"
            />
            <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap gap-2">
                {badges.filter(Boolean).slice(0, 5).map((badge, index) => (
                  <span key={`${badge}-${index}`} className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium dark:border-white/10 dark:bg-white/5">
                    {badge}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-black/35 dark:text-white/35">{config.label}</p>
              <h1 className="mt-2 break-words text-3xl font-bold tracking-[-0.04em] sm:text-5xl">{title}</h1>
              <p className="mt-5 line-clamp-4 text-sm leading-7 text-black/55 dark:text-white/55 sm:text-base">{description}</p>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                {externalUrl ? (
                  <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/85 dark:bg-white dark:text-black sm:w-fit">
                    {type === "prompts" ? <ExternalLink className="h-4 w-4" /> : <Github className="h-4 w-4" />}
                    {externalLabel}
                  </a>
                ) : null}
                <FavoriteButton toolId={id} itemType={type} callbackUrl={canonicalPath} className="sm:w-auto" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 dark:border-white/10">
              <StatIcon kind={stat.kind} />
              <div className="mt-4 break-words text-xl font-semibold sm:text-2xl">{stat.value}</div>
              <div className="mt-1 text-xs text-black/45 dark:text-white/45">{stat.label}</div>
            </div>
          ))}
        </section>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0 rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Описание</h2>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-black/60 dark:text-white/60 sm:text-base">{description}</p>

            {content ? (
              <section className="mt-8 border-t border-black/10 pt-7 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">{contentTitle}</h2>
                  <CopyTextButton value={content} />
                </div>
                <pre className="mt-5 max-h-[680px] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-black/10 bg-black/[0.025] p-5 font-mono text-xs leading-6 text-black/75 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75 sm:text-sm">{content}</pre>
              </section>
            ) : null}

            {installCommand ? (
              <section className="mt-8 border-t border-black/10 pt-7 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Установка</h2>
                  <CopyTextButton value={installCommand} label="Копировать команду" />
                </div>
                <pre className="mt-5 overflow-x-auto rounded-2xl bg-black p-5 font-mono text-xs leading-6 text-white sm:text-sm">{installCommand}</pre>
              </section>
            ) : null}

            {markdown ? (
              <section className="mt-8 border-t border-black/10 pt-7 dark:border-white/10">
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">README</h2>
                <div className="mt-5">
                  <MarkdownDescription markdown={markdown} readmeBaseUrl={readmeBaseUrl} />
                </div>
              </section>
            ) : null}

            {coverImages.length > 1 ? (
              <section className="mt-8 border-t border-black/10 pt-7 dark:border-white/10">
                <h2 className="text-xl font-semibold">Изображения</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {coverImages.slice(1).map((image, index) => (
                    <ToolImage key={`${image}-${index}`} src={image} alt={`${title}, изображение ${index + 2}`} className="h-52 w-full rounded-2xl border border-black/10 object-cover dark:border-white/10" />
                  ))}
                </div>
              </section>
            ) : null}

            {tags.length > 0 ? (
              <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-black/35 dark:text-white/35">Теги</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-black/5 px-3 py-1.5 text-xs text-black/60 dark:bg-white/5 dark:text-white/60">{tag}</span>)}
                </div>
              </div>
            ) : null}
          </article>

          <aside className="h-fit rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 sm:p-6 lg:sticky lg:top-5">
            <h2 className="text-lg font-semibold">Краткая информация</h2>
            <dl className="mt-3">
              {details.map((detail) => (
                <div key={detail.label} className="grid grid-cols-[minmax(90px,0.8fr)_minmax(0,1.2fr)] gap-4 border-b border-black/10 py-3 last:border-0 dark:border-white/10">
                  <dt className="text-sm text-black/45 dark:text-white/45">{detail.label}</dt>
                  <dd className="min-w-0 break-words text-right text-sm font-medium">{detail.value}</dd>
                </div>
              ))}
            </dl>
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center gap-2 rounded-2xl bg-black/[0.03] p-4 text-xs font-medium transition hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]">
                <FileCode2 className="h-4 w-4" />
                Открыть первоисточник
              </a>
            ) : null}
          </aside>
        </div>
      </main>

      <div className="border-t border-black/10 dark:border-white/10"><Footer /></div>
    </div>
  );
}
