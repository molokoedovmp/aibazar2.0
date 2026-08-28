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
  markdown,
  readmeBaseUrl,
}: {
  markdown: string;
  readmeBaseUrl: string | null;
}) {
  return (
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
  );
}
