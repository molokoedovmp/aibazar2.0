"use client";

import { useEffect, useState } from "react";

export default function DocHeaderTitle({ docId, defaultTitle }: { docId?: string; defaultTitle: string }) {
  const [title, setTitle] = useState(defaultTitle);

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail as { id?: string; title?: string } | undefined;
      if (!detail) return;
      if (docId && detail.id !== docId) return;
      if (detail.title) setTitle(detail.title);
    };
    window.addEventListener("document-updated", handler as unknown as EventListener);
    return () => window.removeEventListener("document-updated", handler as unknown as EventListener);
  }, [docId]);

  return <span className="line-clamp-1">{title}</span>;
}

