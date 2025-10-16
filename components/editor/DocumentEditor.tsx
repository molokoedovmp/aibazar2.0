"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  id: string;
  initialTitle: string;
  initialContent?: string | null;
};

export default function DocumentEditor({ id, initialTitle, initialContent }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent ?? "");
  }, [id, initialTitle, initialContent]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название документа" />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} placeholder="Начните писать..." />
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button>
        {savedAt && <span className="text-xs text-muted-foreground">Сохранено: {savedAt.toLocaleTimeString()}</span>}
      </div>
      <p className="text-xs text-muted-foreground">Позже можно заменить на BlockNote. Сейчас используется простой редактор.</p>
    </div>
  );
}

