"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { ru } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import { Input } from "@/components/ui/input";
import AICompose from "@/components/editor/AICompose";

type Props = {
  id: string;
  initialTitle: string;
  initialContent?: string | null;
  dockRightOnDesktop?: boolean;
  disableInlineAI?: boolean;
};

export default function BlockNoteEditor({ id, initialTitle, initialContent, dockRightOnDesktop, disableInlineAI }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string | null>(null);
  const lastSavedTitleRef = useRef<string | null>(initialTitle);
  const [isMounted, setIsMounted] = useState(false);

  const initialBlocks = useMemo(() => {
    if (!initialContent) return undefined;
    try {
      const json = JSON.parse(initialContent);
      return json;
    } catch {
      return [
        {
          type: "paragraph",
          content: [{ type: "text", text: String(initialContent) }],
        },
      ];
    }
  }, [initialContent]);

  // Синхронизация заголовка при смене документа
  useEffect(() => {
    setTitle(initialTitle);
    // при смене документа сбросим последний сохраненный контент/заголовок
    lastSavedTitleRef.current = initialTitle;
    try {
      const current = JSON.stringify((editor as any)?.document ?? "");
      lastSavedContentRef.current = current;
    } catch {}
  }, [id, initialTitle]);

  useEffect(() => {
    setIsMounted(true);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        saveNow(true);
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && isDirty) {
        saveNow(true);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (isDirty) saveNow(true);
    };
  }, []);

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    // Полная локализация интерфейса редактора на русский язык
    dictionary: ru,
    uploadFile: async (file: File) => {
      return URL.createObjectURL(file);
    }
  });

  // Сделаем редактор доступным правой панели через window (для изолированного Sidebar справа)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      (window as any).__activeEditor = editor;
      window.dispatchEvent(
        new CustomEvent("bazarius-editor-ready", {
          detail: { docId: id },
        })
      );
    } catch {}
    return () => {
      try {
        if ((window as any).__activeEditor === editor) {
          (window as any).__activeEditor = undefined;
          window.dispatchEvent(
            new CustomEvent("bazarius-editor-reset", {
              detail: { docId: id },
            })
          );
        }
      } catch {}
    };
  }, [editor, id]);

  // Локализация и вставка видео по ссылке (YouTube/VK)
  useEffect(() => {
    if (!editor) return;

    const toYoutubeEmbed = (url: string) => {
      try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) {
          const id = u.pathname.slice(1);
          return `https://www.youtube.com/embed/${id}`;
        }
        if (u.hostname.includes("youtube.com")) {
          const id = u.searchParams.get("v");
          if (id) return `https://www.youtube.com/embed/${id}`;
        }
      } catch {}
      return null;
    };

    const toVkEmbed = (url: string) => {
      try {
        const u = new URL(url);
        if (u.hostname.includes("vk.com") && u.pathname.startsWith("/video")) {
          return `https://vk.com/video_ext.php?${u.searchParams.toString()}`;
        }
      } catch {}
      return null;
    };

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      const yt = toYoutubeEmbed(text);
      const vk = toVkEmbed(text);
      const embed = yt || vk;
      if (!embed) return;
      e.preventDefault();
      try {
        (editor as any).insertBlocks?.([
          { type: "embed", props: { url: embed } },
        ]);
      } catch {
        try {
          (editor as any).insertBlocks?.([
            { type: "paragraph", content: [{ type: "text", text: text }] },
          ]);
        } catch {}
      }
    };

    document.addEventListener("paste", handlePaste as any);
    return () => document.removeEventListener("paste", handlePaste as any);
  }, [editor]);

  // Немедленное сохранение (используется для flush при закрытии вкладки)
  async function saveNow(useBeacon = false) {
    if (!editor) return;
    const content = JSON.stringify((editor as any).document);
    const nothingChanged =
      content === lastSavedContentRef.current && title === lastSavedTitleRef.current;
    if (nothingChanged) return;

    setSaving(true);
    try {
      const payload = JSON.stringify({ title, content });
      if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`/api/documents/${id}`, blob);
        // считаем успешным для UX, сервер примет beacon асинхронно
        lastSavedContentRef.current = content;
        lastSavedTitleRef.current = title;
        setSavedAt(new Date());
        setIsDirty(false);
        // обновим сайдбар
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("document-updated", {
              detail: { id, title, updatedAt: new Date().toISOString() },
            })
          );
        }
        return;
      }

      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
      if (!res.ok) throw new Error("Failed to save");
      let updatedAtIso: string | undefined;
      try {
        const json = await res.json();
        if (json?.updatedAt) updatedAtIso = json.updatedAt;
      } catch {}
      lastSavedContentRef.current = content;
      lastSavedTitleRef.current = title;
      setSavedAt(updatedAtIso ? new Date(updatedAtIso) : new Date());
      setIsDirty(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("document-updated", {
            detail: { id, title, updatedAt: updatedAtIso ?? new Date().toISOString() },
          })
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function scheduleSave() {
    setIsDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveNow(false);
    }, 800);
  }

  useEffect(() => {
    // Автосохранение при изменении заголовка
    if (!isMounted) return;
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название документа"
      />
      <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-gray-100">
        {isMounted ? (
          <BlockNoteView
            editor={editor}
            theme="light"
            onChange={() => scheduleSave()}
            className="h-full min-w-0 bg-white !border-0 !shadow-none !ring-0 !outline-none"
            data-testid="blocknote-editor"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Загрузка редактора...
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {saving ? "Автосохранение..." : isDirty ? "Изменения не сохранены" : savedAt ? `Сохранено: ${savedAt.toLocaleTimeString()}` : ""}
        </span>
      </div>

      {!disableInlineAI && (
        dockRightOnDesktop ? (
          <div className="lg:hidden">
            <AICompose editor={editor} documentTitle={title} />
          </div>
        ) : (
          <AICompose editor={editor} documentTitle={title} />
        )
      )}
    </div>
  );
}
