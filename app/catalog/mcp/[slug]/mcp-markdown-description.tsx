"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function resolveReadmeUrl(url: string | undefined, readmeBaseUrl: string | null) {
  if (!url || !readmeBaseUrl || /^(?:[a-z]+:|#|\/\/)/i.test(url)) return url;
  try {
    return new URL(url.replace(/^\//, ""), readmeBaseUrl).toString();
  } catch {
    return url;
  }
}

export function McpMarkdownDescription({
  slug,
  initialMarkdown,
  fallbackMarkdown,
  readmeBaseUrl,
}: {
  slug: string;
  initialMarkdown: string | null;
  fallbackMarkdown: string;
  readmeBaseUrl: string | null;
}) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initialMarkdown) return;
    const controller = new AbortController();

    fetch(`/api/library/mcp/${encodeURIComponent(slug)}/translate`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("MCP translation request failed");
        return (await response.json()) as { markdown?: string };
      })
      .then((payload) => {
        if (!payload.markdown) throw new Error("MCP translation is empty");
        setMarkdown(payload.markdown);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
        setMarkdown(fallbackMarkdown);
      });

    return () => controller.abort();
  }, [fallbackMarkdown, initialMarkdown, slug]);

  if (!markdown) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-sm text-sky-900/70">
        <div className="font-medium text-sky-900">Переводим полное описание…</div>
        <p className="mt-2 leading-6">Страница уже доступна. Русский Markdown появится здесь автоматически.</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sky-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-sky-500" />
        </div>
      </div>
    );
  }

  return (
    <>
      {failed && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Автоматический перевод временно недоступен — показан оригинал.
        </div>
      )}
      <div className="max-w-none break-words text-sm leading-7 text-black/70 sm:text-base [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-black/20 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:my-4 [&_ol]:space-y-2 [&_p]:my-4 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black [&_pre]:p-4 [&_pre]:text-white [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black/10 [&_td]:p-2 [&_th]:border [&_th]:border-black/10 [&_th]:bg-black/5 [&_th]:p-2 [&_ul]:my-4 [&_ul]:space-y-2">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, ...props }) => (
              <a
                {...props}
                href={resolveReadmeUrl(href, readmeBaseUrl)}
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            img: ({ src, alt, ...props }) => (
              // README images come from third-party GitHub repositories.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...props}
                src={typeof src === "string" ? resolveReadmeUrl(src, readmeBaseUrl) : undefined}
                alt={alt || ""}
                loading="lazy"
                className="my-5 h-auto max-w-full rounded-xl"
              />
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </>
  );
}
