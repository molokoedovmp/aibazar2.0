"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

type Mode = "floating" | "dockRight" | "sidebar";
type HistoryItem = { role: "user" | "assistant"; content: string; insertedIds?: string[] };
type Props = {
  editor: any;
  documentTitle?: string;
  mode?: Mode; // default: floating; dockRight — постоянная боковая панель справа
  sidebarWidth?: number;
  onResize?: (w: number) => void;
};

export default function AICompose({ editor, documentTitle, mode = "floating", sidebarWidth = 360, onResize }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastAssistantIndex = useMemo(() => {
    for (let i = history.length - 1; i >= 0; i--) if (history[i].role === "assistant") return i;
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

  // При первом рендере прокручиваем чат вниз, чтобы была видна последняя реплика
  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, []);

  useEffect(() => {
    fetch('/api/credits', { cache: 'no-store' })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error('fail'))))
      .then(d => { if (d && typeof d.total === 'number') setCredits({ total: d.total, used: d.used, remaining: d.remaining }); })
      .catch(() => setCredits((prev) => prev ?? { total: 5, used: 0, remaining: 5 }));
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
      setHistory((h) => [...h, { role: "user", content: prompt }, { role: "assistant", content: text }]);
      setPrompt("");
      if (credits) setCredits({ total: credits.total, used: credits.used + 1, remaining: Math.max(0, credits.remaining - 1) });
    } catch (e: any) {
      setError(e?.message || "Не удалось получить ответ ИИ");
    } finally {
      setLoading(false);
    }
  }

  const isDock = mode === "dockRight";
  const isSidebar = mode === "sidebar";

  return (
    <div ref={containerRef} className={
      isSidebar
        ? "w-full h-full min-h-0"
        : isDock
          ? "hidden lg:flex fixed right-3 top-20 bottom-3 z-30 w-[360px]"
          : open
            ? "fixed inset-0 z-50"
            : "fixed right-3 bottom-[calc(var(--mobile-bar-h,0)+12px)] z-40 sm:right-6"
    }>
      {isSidebar ? (
        <div className="relative h-full max-h-full min-h-0" style={{ width: sidebarWidth }}>
          <div
            className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            onPointerDown={(e) => {
              if (!onResize) return;
              const startX = e.clientX;
              const startW = sidebarWidth;
              const onMove = (ev: PointerEvent) => {
                const dx = startX - ev.clientX;
                const next = Math.max(280, Math.min(560, startW + dx));
                onResize(next);
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />

          <div className="flex h-full min-h-0 w-full flex-col rounded-2xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="flex-shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                  <Sparkles className="h-4 w-4" /> ИИ-помощник
                </div>
                <button className="text-xs text-gray-500 hover:underline" onClick={() => setHistory([])}>Очистить</button>
              </div>
              {credits && (
                <div className="mb-2 rounded-md border border-gray-100 p-2 dark:border-white/10">
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Кредиты: использовано {credits.total - credits.remaining} из {credits.total}</span>
                    <button className="underline" onClick={() => (window.location.href = '/credits')}>Добавить кредиты</button>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-900">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, ((credits.total - credits.remaining)/Math.max(1, credits.total))*100)}%` }} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Осталось: {credits.remaining}</span>
                    <span>Всего: {credits.total}</span>
                  </div>
                  {credits.remaining <= 0 && (
                    <div className="mt-2 rounded-md bg-rose-50 p-2 text-[11px] text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                      Нет кредитов. Оформите пакет, чтобы продолжить.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div ref={msgsRef} className="flex-1 min-h-0 overflow-auto overscroll-contain rounded-md border border-black/10 p-2 text-sm dark:border-white/10">
              {history.length === 0 ? (
                <div className="text-gray-500">Опишите задачу. Пример: «Сделай краткое резюме введения и список шагов по пунктам».</div>
              ) : (
                history.map((m, i) => {
                  const isUser = m.role === "user";
                  const isLastAssistant = i === lastAssistantIndex;
                  return (
                    <div key={i} className={`mb-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`${isUser ? "bg-primary/10 text-black dark:text-white" : "bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200"} max-w-[95%] whitespace-pre-wrap rounded-2xl px-3 py-2 shadow-sm`}>
                        <div>{m.content}</div>
                        {!isUser && isLastAssistant && (
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                            <button className="underline hover:no-underline" onClick={async () => {
                              const ids = await insertRichTextTrack(editor, m.content);
                              setHistory((h) => h.map((it, idx) => (idx === i ? { ...it, insertedIds: ids } : it)));
                            }}>Вставить</button>
                            <span>•</span>
                            <button className="underline hover:no-underline" onClick={() => {
                              const ids = history[i]?.insertedIds;
                              if (ids && ids.length && typeof (editor as any)?.removeBlocks === 'function') {
                                try { (editor as any).removeBlocks(ids); } catch {}
                                setHistory((h) => h.map((it, idx) => (idx === i ? { ...it, insertedIds: undefined } : it)));
                              }
                            }}>Откатить</button>
                            <span>•</span>
                            <button className="underline hover:no-underline" onClick={async () => {
                              await replaceWholeDocument(editor, m.content);
                            }}>Заменить документ</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex-shrink-0 pt-2">
              <div>
                <Textarea
                  className="max-h-40 overflow-auto"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Опишите, что нужно написать/отредактировать"
                  rows={3}
                  disabled={Boolean(credits && credits.remaining <= 0)}
                />
              </div>
              {error && <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-[11px] text-gray-500">Сначала посмотрите результат, затем вставьте в документ</div>
                <Button onClick={handleSend} disabled={loading || !prompt.trim() || Boolean(credits && credits.remaining <= 0)}>{loading ? "Генерация…" : "Сгенерировать"}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : isDock ? (
        <div className="flex h-full w-full flex-col rounded-2xl border border-black/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-zinc-950">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-black dark:text-white">ИИ-помощник</div>
            {/* Кнопка очистки истории */}
            <button
              className="text-xs text-gray-500 hover:underline"
              onClick={() => setHistory([])}
            >
              Очистить
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto overscroll-contain rounded-md border border-black/10 p-2 text-sm dark:border-white/10">
            {history.length === 0 ? (
              <div className="text-gray-500">
                Опишите задачу. Пример: «Сделай краткое резюме введения и список шагов по пунктам».
              </div>
            ) : (
              history.map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 whitespace-pre-wrap ${m.role === "user" ? "text-black dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                >
                  <span className="mr-1 font-medium">{m.role === "user" ? "Вы:" : "ИИ:"}</span>
                  {m.content}
                </div>
              ))
            )}
          </div>
          <div className="mt-2">
            <Textarea
              className="max-h-40 overflow-auto"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите, что нужно написать/отредактировать"
              rows={3}
            />
          </div>
          {error && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button onClick={handleSend} disabled={loading || !prompt.trim()}>
              {loading ? "Генерация…" : "Сгенерировать"}
            </Button>
          </div>
        </div>
      ) : !open ? (
        <Button onClick={() => setOpen(true)} className="shadow-md">ИИ-помощник</Button>
      ) : (
        // Полноэкранный статичный диалог с прокруткой контента
        <div className="flex h-[100dvh] w-[100vw] flex-col bg-white dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-black/10 p-3 dark:border-white/10">
            <div className="text-sm font-medium text-black dark:text-white">ИИ-помощник</div>
            <button className="text-xs text-gray-500 hover:underline" onClick={() => setOpen(false)}>Закрыть (⌘/Ctrl+I)</button>
          </div>
          <div ref={msgsRef} className="flex-1 min-h-0 overflow-auto overscroll-contain p-3">
            <div className="rounded-md border border-black/10 p-2 text-sm dark:border-white/10">
              {history.length === 0 ? (
                <div className="text-gray-500">Опишите задачу. Пример: «Сделай краткое резюме введения и список шагов по пунктам».</div>
              ) : (
                history.map((m, i) => (
                  <div key={i} className={`mb-2 whitespace-pre-wrap ${m.role === "user" ? "text-black dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    <span className="font-medium mr-1">{m.role === "user" ? "Вы:" : "ИИ:"}</span>
                    {m.content}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="border-t border-black/10 p-3 dark:border-white/10">
            <Textarea
              className="max-h-40 overflow-auto"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите, что нужно написать/отредактировать"
              rows={3}
            />
            {error && <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
            <div className="mt-2 flex items-center justify-end gap-2">
              <Button onClick={handleSend} disabled={loading || !prompt.trim()}>
                {loading ? "Генерация…" : "Сгенерировать"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getSelectionText(editor: any): string {
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
  if (!text) return;
  // 1) Попробуем нативный парсер BlockNote для Markdown
  let blocks: any[] | null = null;
  try {
    if (typeof editor?.tryParseMarkdownToBlocks === "function") {
      const parsed = await editor.tryParseMarkdownToBlocks(String(text));
      if (Array.isArray(parsed) && parsed.length) blocks = parsed as any[];
    }
  } catch {}
  // 2) Фолбэк — каждый абзац отдельным параграфом
  if (!blocks) {
    const paragraphs = String(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    blocks = paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] }));
  }
  try {
    const refBlock = (editor as any)?.getTextCursorPosition?.()?.block;
    if (refBlock) (editor as any)?.insertBlocks?.(blocks as any[], refBlock, "after");
    else (editor as any)?.insertBlocks?.(blocks as any[], (editor as any)?.getTextCursorPosition?.()?.block, "after");
  } catch {
    try {
      const ref = (editor as any)?.getTextCursorPosition?.()?.block;
      for (const b of blocks as any[]) (editor as any)?.insertBlocks?.([b], ref, "after");
    } catch {}
  }
}

// Вставка с отслеживанием ID вставленных блоков, чтобы можно было откатить
async function insertRichTextTrack(editor: any, text: string): Promise<string[]> {
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
  try {
    const doc = (editor as any)?.document ?? [];
    return Array.isArray(doc) ? doc.map((b: any) => b?.id).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function replaceWholeDocument(editor: any, text: string) {
  try {
    // Парсим Markdown в блоки
    let blocks: any[] | null = null;
    try {
      if (typeof editor?.tryParseMarkdownToBlocks === "function") {
        const parsed = await editor.tryParseMarkdownToBlocks(String(text));
        if (Array.isArray(parsed) && parsed.length) blocks = parsed as any[];
      }
    } catch {}
    if (!blocks) {
      const paragraphs = String(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      blocks = paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] }));
    }

    // Удаляем старые блоки и вставляем новые
    const allIds = getTopLevelIds(editor);
    if (typeof (editor as any)?.removeBlocks === "function" && allIds.length) {
      try { (editor as any).removeBlocks(allIds); } catch {}
    }
    // Вставляем относительно текущего курсора или в начало
    const ref = (editor as any)?.getTextCursorPosition?.()?.block ?? (editor as any)?.document?.[0]?.id;
    if (ref) (editor as any)?.insertBlocks?.(blocks as any[], ref, "before");
    else (editor as any)?.insertBlocks?.(blocks as any[], (editor as any)?.getTextCursorPosition?.()?.block, "after");
  } catch {}
}
