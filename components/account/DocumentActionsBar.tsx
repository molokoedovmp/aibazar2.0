"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, Star as StarIcon, UploadCloud } from "lucide-react";

interface DocumentActionsBarProps {
  docId: string;
  initialTitle: string;
  initialFavorite: boolean;
  initialPublished: boolean;
}

export default function DocumentActionsBar({
  docId,
  initialTitle,
  initialFavorite,
  initialPublished,
}: DocumentActionsBarProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [pendingAction, setPendingAction] = useState<"publish" | "favorite" | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  useEffect(() => {
    setIsPublished(initialPublished);
  }, [initialPublished]);

  const updateDocument = (patch: { isFavorite?: boolean; isPublished?: boolean }) => {
    const action = patch.isFavorite !== undefined ? "favorite" : "publish";
    if (pendingAction) return;
    setPendingAction(action);
    (async () => {
      try {
        const response = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (patch.isFavorite !== undefined) {
          const nextFavorite = Boolean(data?.isFavorite);
          setIsFavorite(nextFavorite);
          window.dispatchEvent(
            new CustomEvent("favorites-updated", {
              detail: {
                id: docId,
                title: data?.title || title,
                action: nextFavorite ? "add" : "remove",
              },
            })
          );
        }
        if (patch.isPublished !== undefined) {
          const nextPublished = Boolean(data?.isPublished);
          setIsPublished(nextPublished);
        }
        const nextTitle = data?.title || title;
        setTitle(nextTitle);
        window.dispatchEvent(
          new CustomEvent("document-updated", {
            detail: {
              id: docId,
              title: nextTitle,
            },
          })
        );
      } catch (error) {
        console.error(error);
      } finally {
        setPendingAction(null);
      }
    })();
  };

  const isPublishing = pendingAction === "publish";
  const isFavoriting = pendingAction === "favorite";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => updateDocument({ isPublished: !isPublished })}
        disabled={Boolean(pendingAction)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition",
          isPublished
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
          pendingAction && "opacity-70"
        )}
      >
        {isPublishing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPublished ? (
          <Check className="h-4 w-4" />
        ) : (
          <UploadCloud className="h-4 w-4" />
        )}
        {isPublished ? "Опубликовано" : "Опубликовать"}
      </button>
      <button
        type="button"
        onClick={() => updateDocument({ isFavorite: !isFavorite })}
        disabled={Boolean(pendingAction)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition",
          isFavorite
            ? "border-yellow-400 bg-yellow-300/20 text-yellow-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
          pendingAction && "opacity-70"
        )}
      >
        {isFavoriting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <StarIcon className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
        )}
        {isFavorite ? "В избранном" : "Добавить в избранное"}
      </button>
    </div>
  );
}
