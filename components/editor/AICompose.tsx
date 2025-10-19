"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

type Mode = "floating" | "dockRight" | "sidebar";
type HistoryItem = { role: "user" | "assistant"; content: string; insertedIds?: string[] };

type Props = {
  editor: any;
  documentTitle?: string;
  mode?: Mode;
};

export default function AICompose({ editor, documentTitle, mode = "floating" }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const lastAssistantIndex = useMemo(() => {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "assistant") return i;
    }
    return -1;
  }, [history]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const msgsRef = useRef<HTMLDivElement | null>(null);
  const [credits, setCredits] = useState<{ total: number; used: number; remaining: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, []);

  useEffect(() => {
    fetch("/api/credits", { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((d) => {
        if (d && typeof d.total === "number") {
          setCredits({ total: d.total, used: d.used, remaining: d.remaining });
        }
      })
      .catch(() =>
        setCredits((prev) => prev ?? { total: 5, used: 0, remaining: 5 })
      );
  }, []);

  async function handleSend() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    const selectionText = getSelectionText(editor);
    try {
      let documentMarkdown: string | undefined = undefined;
      try {
        if (typeof (editor as any)?.blocksToMarkdownLossy === "function") {
          documentMarkdown = await (editor as any).blocksToMarkdownLossy();
        }
      } catch {}

      const res = await fetch("/api/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          prompt,
          documentTitle,
          selection: selectionText || undefined,
          documentMarkdown,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "AI request failed");
      const text: string = data?.text ?? "";
      const normalizedText = normalizeAssistantText(text);
      setHistory((h) => [
        ...h,
        { role: "user", content: prompt },
        { role: "assistant", content: normalizedText },
      ]);
      setPrompt("");
      if (credits) {
        setCredits({
          total: credits.total,
          used: credits.used + 1,
          remaining: Math.max(0, credits.remaining - 1),
        });
      }
    } catch (e: any) {
      setError(e?.message || "Не удалось получить ответ Bazarius");
    } finally {
      setLoading(false);
    }
  }

  const isDock = mode === "dockRight";
  const isSidebar = mode === "sidebar";
  const creditsDepleted = Boolean(credits && credits.remaining <= 0);
  const canModifyDocument = Boolean(editor);

  const historyEmptyPlaceholder =
    "Опишите задачу. Пример: «Сделай краткое резюме введения и список шагов по пунктам».";

  const sidebarContent = (
    <div
      className="flex h-full max-h-full min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden"
      style={{ height: "100%", maxHeight: "100%" }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm font-semibold text-black dark:text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-black dark:text-white" />
            <span>Bazarius</span>
          </div>
          <button
            className="text-xs font-normal text-gray-500 hover:underline dark:text-gray-400"
            onClick={() => setHistory([])}
          >
            Очистить
          </button>
        </div>
        {credits && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 text-xs text-gray-600 dark:border-white/10 dark:bg-zinc-900/40 dark:text-gray-300">
            <div className="flex items-center justify-between gap-2">
              <span>
                Кредиты: использовано {credits.total - credits.remaining} из{" "}
                {credits.total}
              </span>
              <button
                className="underline transition hover:no-underline"
                onClick={() => (window.location.href = "/credits")}
              >
                Добавить кредиты
              </button>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    ((credits.total - credits.remaining) /
                      Math.max(1, credits.total)) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>Осталось: {credits.remaining}</span>
              <span>Всего: {credits.total}</span>
            </div>
            {credits.remaining <= 0 && (
              <div className="mt-2 rounded-md bg-rose-50 p-2 text-[11px] text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                Нет кредитов. Оформите пакет, чтобы продолжить.
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={msgsRef}
        className="flex-1 min-h-0 overflow-auto overscroll-contain rounded-xl border border-black/10 bg-white p-3 text-sm shadow-inner dark:border-white/10 dark:bg-zinc-950/70"
      >
        {history.length === 0 ? (
          <div className="text-gray-500">{historyEmptyPlaceholder}</div>
        ) : (
          history.map((m, i) => {
            const isUser = m.role === "user";
            const isLastAssistant = i === lastAssistantIndex;
            return (
              <div
                key={i}
                className={`mb-2 flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`${
                    isUser
                      ? "bg-primary/10 text-black dark:text-white"
                      : "bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200"
                  } max-w-[95%] whitespace-pre-wrap rounded-2xl px-3 py-2 shadow-sm`}
                >
                  <div>{m.content}</div>
                  {!isUser && isLastAssistant && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                      <button
                        className={`underline hover:no-underline ${
                          canModifyDocument ? "" : "pointer-events-none opacity-40"
                        }`}
                        onClick={async () => {
                          if (!canModifyDocument) return;
                          const ids = await insertRichTextTrack(editor, m.content);
                          setHistory((h) =>
                            h.map((it, idx) =>
                              idx === i ? { ...it, insertedIds: ids } : it
                            )
                          );
                        }}
                      >
                        Вставить
                      </button>
                      <span>•</span>
                      <button
                        className={`underline hover:no-underline ${
                          canModifyDocument ? "" : "pointer-events-none opacity-40"
                        }`}
                        onClick={() => {
                          if (!canModifyDocument) return;
                          const ids = history[i]?.insertedIds;
                          if (
                            ids &&
                            ids.length &&
                            typeof (editor as any)?.removeBlocks === "function"
                          ) {
                            try {
                              (editor as any).removeBlocks(ids);
                            } catch {}
                            setHistory((h) =>
                              h.map((it, idx) =>
                                idx === i ? { ...it, insertedIds: undefined } : it
                              )
                            );
                          }
                        }}
                      >
                        Откатить
                      </button>
                      <span>•</span>
                      <button
                        className={`underline hover:no-underline ${
                          canModifyDocument ? "" : "pointer-events-none opacity-40"
                        }`}
                        onClick={async () => {
                          if (!canModifyDocument) return;
                          await replaceWholeDocument(editor, m.content);
                        }}
                      >
                        Заменить документ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex-shrink-0 space-y-2 pt-1">
        <Textarea
          className="h-24 overflow-auto resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите, что нужно написать/отредактировать"
          rows={4}
          disabled={creditsDepleted}
        />
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
          <span>Сначала посмотрите результат, затем вставьте в документ</span>
          <Button
            onClick={handleSend}
            size="sm"
            disabled={loading || !prompt.trim() || creditsDepleted}
          >
            {loading ? "Генерация…" : "Сгенерировать"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isSidebar) {
    return sidebarContent;
  }

  const dockClampStyle = isDock
    ? ({
        maxWidth: "calc(100vw - 24px)",
      } as CSSProperties)
    : undefined;

  const dockLayout = (
    <div className="box-border grid h-full w-full max-w-full grid-rows-[auto,1fr,auto] gap-2 overflow-hidden rounded-2xl border border-black/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-medium text-black dark:text-white">Bazarius</div>
        <button
          className="text-xs text-gray-500 hover:underline"
          onClick={() => setHistory([])}
        >
          Очистить
        </button>
      </div>
      <div
        ref={msgsRef}
        className="min-h-[200px] flex-1 overflow-auto overscroll-contain rounded-md border border-black/10 bg-gray-50 p-2 text-sm dark:border-white/10 dark:bg-zinc-900/40"
      >
        {history.length === 0 ? (
          <div className="text-gray-500">{historyEmptyPlaceholder}</div>
        ) : (
          history.map((m, i) => (
            <div
              key={i}
              className={`mb-2 whitespace-pre-wrap ${
                m.role === "user"
                  ? "text-black dark:text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="mr-1 font-medium">
                {m.role === "user" ? "Вы:" : "Bazarius:"}
              </span>
              {m.content}
            </div>
          ))
        )}
      </div>
      <div className="space-y-2">
        <Textarea
          className="h-24 overflow-auto resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите, что нужно написать/отредактировать"
          rows={3}
          disabled={creditsDepleted}
        />
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={handleSend}
            disabled={loading || !prompt.trim() || creditsDepleted}
          >
            {loading ? "Генерация…" : "Сгенерировать"}
          </Button>
        </div>
      </div>
    </div>
  );

  const floatingLayout = !open ? (
    <Button onClick={() => setOpen(true)} className="shadow-md">
      Bazarius
    </Button>
  ) : (
    <div className="box-border grid h-[100dvh] w-[100vw] max-h-[100dvh] max-w-[100vw] grid-rows-[auto,1fr,auto] bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-black/10 p-3 dark:border-white/10">
        <div className="text-sm font-medium text-black dark:text-white">Bazarius</div>
        <button
          className="text-xs text-gray-500 hover:underline"
          onClick={() => setOpen(false)}
        >
          Закрыть (⌘/Ctrl+I)
        </button>
      </div>
      <div ref={msgsRef} className="flex-1 min-h-0 overflow-auto overscroll-contain p-3">
        <div className="rounded-md border border-black/10 p-2 text-sm dark:border-white/10">
          {history.length === 0 ? (
            <div className="text-gray-500">{historyEmptyPlaceholder}</div>
          ) : (
            history.map((m, i) => (
              <div
                key={i}
                className={`mb-2 whitespace-pre-wrap ${
                  m.role === "user"
                    ? "text-black dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="mr-1 font-medium">
                  {m.role === "user" ? "Вы:" : "Bazarius:"}
                </span>
                {m.content}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="border-t border-black/10 p-3 dark:border-white/10">
        <div className="space-y-2">
          <Textarea
            className="h-24 overflow-auto resize-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Опишите, что нужно написать/отредактировать"
            rows={3}
            disabled={creditsDepleted}
          />
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={handleSend}
              disabled={loading || !prompt.trim() || creditsDepleted}
            >
              {loading ? "Генерация…" : "Сгенерировать"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={
        isDock
          ? "hidden lg:flex fixed right-3 top-20 bottom-3 z-30 w-[360px]"
          : open
            ? "fixed inset-0 z-50"
            : "fixed right-3 bottom-[calc(var(--mobile-bar-h,0)+12px)] z-40 sm:right-6"
      }
      style={dockClampStyle}
    >
      {isDock ? dockLayout : floatingLayout}
    </div>
  );
}

function normalizeAssistantText(raw: string): string {
  if (!raw) return "";
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  const fenceMatch = normalized.match(/^```[\w-]*\n?([\s\S]*?)\n?```$/);
  if (fenceMatch) {
    const extracted = fenceMatch[1].trim();
    return extracted.length ? extracted : normalized;
  }
  return normalized;
}

function getSelectionText(editor: any): string {
  if (!editor) return "";
  try {
    const sel = (editor as any)?.getSelection?.();
    const blocks = sel?.blocks ?? [];
    const texts: string[] = [];
    for (const b of blocks) {
      if (typeof b?.props?.text === "string") texts.push(b.props.text);
      else if (Array.isArray(b?.content))
        texts.push(b.content.map((n: any) => n?.text).filter(Boolean).join(" "));
    }
    return texts.filter(Boolean).join("\n\n").trim();
  } catch {
    return "";
  }
}

async function insertRichText(editor: any, text: string) {
  if (!editor || !text) return;
  let blocks: any[] | null = null;
  try {
    if (typeof editor?.tryParseMarkdownToBlocks === "function") {
      const parsed = await editor.tryParseMarkdownToBlocks(String(text));
      if (Array.isArray(parsed) && parsed.length) blocks = parsed as any[];
    }
  } catch {}
  if (!blocks) {
    const paragraphs = String(text)
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    blocks = paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p }],
    }));
  }
  try {
    const refBlock = (editor as any)?.getTextCursorPosition?.()?.block;
    if (refBlock) (editor as any)?.insertBlocks?.(blocks as any[], refBlock, "after");
    else
      (editor as any)?.insertBlocks?.(
        blocks as any[],
        (editor as any)?.getTextCursorPosition?.()?.block,
        "after"
      );
  } catch {
    try {
      const ref = (editor as any)?.getTextCursorPosition?.()?.block;
      for (const b of blocks as any[]) (editor as any)?.insertBlocks?.([b], ref, "after");
    } catch {}
  }
}

async function insertRichTextTrack(editor: any, text: string): Promise<string[]> {
  if (!editor) return [];
  try {
    const before = getTopLevelIds(editor);
    await insertRichText(editor, text);
    const after = getTopLevelIds(editor);
    const added = after.filter((id: string) => !before.includes(id));
    return added;
  } catch {
    return [];
  }
}

function getTopLevelIds(editor: any): string[] {
  if (!editor) return [];
  try {
    const doc = (editor as any)?.document ?? [];
    return Array.isArray(doc) ? doc.map((b: any) => b?.id).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function replaceWholeDocument(editor: any, text: string) {
  if (!editor) return;
  try {
    let blocks: any[] | null = null;
    try {
      if (typeof editor?.tryParseMarkdownToBlocks === "function") {
        const parsed = await editor.tryParseMarkdownToBlocks(String(text));
        if (Array.isArray(parsed) && parsed.length) blocks = parsed as any[];
      }
    } catch {}
    if (!blocks) {
      const paragraphs = String(text)
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      blocks = paragraphs.map((p) => ({
        type: "paragraph",
        content: [{ type: "text", text: p }],
      }));
    }
    const existingIds = getTopLevelIds(editor);
    if (typeof (editor as any)?.replaceBlocks === "function" && existingIds.length) {
      (editor as any).replaceBlocks(existingIds, blocks);
      return;
    }
    if (typeof (editor as any)?.removeBlocks === "function" && existingIds.length) {
      try {
        (editor as any).removeBlocks(existingIds);
      } catch {}
    }
    if (typeof (editor as any)?.insertBlocks === "function") {
      (editor as any).insertBlocks(blocks);
    }
  } catch {}
}
