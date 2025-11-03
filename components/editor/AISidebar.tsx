"use client";

import { useEffect, useMemo, useState } from "react";
import AICompose from "@/components/editor/AICompose";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  editor?: any;
  documentTitle?: string;
  width?: string | number;
};

const MIN_WIDTH = 300;
const MAX_WIDTH = 560;
const PANEL_HEIGHT = "calc(100dvh - 5.5rem)";

function clampWidth(value: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

export default function AISidebar({ editor, documentTitle, width }: Props) {
  const [resolvedEditor, setResolvedEditor] = useState<any>(editor ?? null);

  const readGlobalEditor = () => {
    if (typeof window === "undefined") return null;
    return (window as any).__activeEditor ?? null;
  };

  useEffect(() => {
    if (editor) {
      setResolvedEditor(editor);
      return;
    }

    if (typeof window === "undefined") {
      setResolvedEditor(null);
      return;
    }

    const update = () => {
      setResolvedEditor(readGlobalEditor());
    };

    update();
    window.addEventListener("bazarius-editor-ready", update as EventListener);
    window.addEventListener("bazarius-editor-reset", update as EventListener);
    return () => {
      window.removeEventListener("bazarius-editor-ready", update as EventListener);
      window.removeEventListener("bazarius-editor-reset", update as EventListener);
    };
  }, [editor]);

  const resolveWidth = (value?: string | number) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      if (value.endsWith("rem")) {
        const num = parseFloat(value);
        return Number.isFinite(num) ? num * 16 : undefined;
      }
      if (value.endsWith("px")) {
        const num = parseFloat(value);
        return Number.isFinite(num) ? num : undefined;
      }
      const num = parseFloat(value);
      if (Number.isFinite(num)) return num;
    }
    return undefined;
  };

  const initialWidth = useMemo(() => {
    const px = resolveWidth(width);
    return clampWidth(px ?? 360);
  }, [width]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(initialWidth);

  useEffect(() => {
    setPanelWidth(initialWidth);
  }, [initialWidth]);

  const handleResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = panelWidth;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = startX - moveEvent.clientX;
      setPanelWidth(clampWidth(startWidth + dx));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.removeProperty("user-select");
    };

    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:w-auto lg:flex-none"
      style={{ height: PANEL_HEIGHT, maxHeight: PANEL_HEIGHT }}
    >
      <aside
        className={cn(
          "relative hidden h-full overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-sm transition-[width,opacity] duration-300 ease-in-out lg:flex lg:flex-col lg:min-h-0",
          "opacity-100"
        )}
        style={{
          height: PANEL_HEIGHT,
          maxHeight: PANEL_HEIGHT,
          width: `${panelWidth}px`,
          minWidth: `${panelWidth}px`,
          maxWidth: `${panelWidth}px`,
        }}
      >
        <div className="flex h-full flex-1 min-h-0 flex-col px-2.5 pb-2.5 pt-2.5">
          <AICompose editor={resolvedEditor} documentTitle={documentTitle} mode="sidebar" />
        </div>
        <div
          className="absolute left-0 top-0 bottom-0 -ml-2 hidden w-3 cursor-ew-resize rounded-full transition-colors hover:bg-gray-200/70 lg:block"
          onPointerDown={handleResizeStart}
        >
          <span className="sr-only"></span>
        </div>
      </aside>

      <div className="flex flex-col gap-2 lg:hidden">
        <Button
          variant="outline"
          className="w-full justify-center text-sm font-semibold"
          onClick={() => setMobileOpen(true)}
        >
          <span></span>
        </Button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="right"
            className="flex w-full max-w-sm flex-col gap-0 p-0"
          >
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle></SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col overflow-hidden p-4">
              <AICompose editor={resolvedEditor} documentTitle={documentTitle} mode="sidebar" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
