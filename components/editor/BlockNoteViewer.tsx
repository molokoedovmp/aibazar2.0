"use client";

import { useMemo, useState, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { ru } from "@blocknote/core/locales";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";

type Props = {
  content?: string | null;
  className?: string;
};

export default function BlockNoteViewer({ content, className }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const initialBlocks = useMemo(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content);
    } catch {
      return [
        {
          type: "paragraph",
          content: [{ type: "text", text: String(content) }],
        },
      ];
    }
  }, [content]);

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    dictionary: ru,
  });

  return (
    <div className={className}>
      {isMounted ? (
        <BlockNoteView
          editor={editor}
          editable={false}
          theme="light"
          className="bg-transparent !border-0 !shadow-none !ring-0 !outline-none"
        />
      ) : null}
    </div>
  );
}

