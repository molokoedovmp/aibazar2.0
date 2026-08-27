"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

type FavoriteItemType = "aiTools" | "mcp" | "prompts" | "skills" | "repos";

interface FavoriteButtonProps {
  toolId: string;
  itemType?: FavoriteItemType;
  isFavoritedInitial?: boolean;
  className?: string;
  iconOnly?: boolean;
  callbackUrl?: string;
}

export default function FavoriteButton({
  toolId,
  itemType = "aiTools",
  isFavoritedInitial = false,
  className,
  iconOnly = false,
  callbackUrl,
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFav, setIsFav] = useState(Boolean(isFavoritedInitial));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch(`/api/favorites?itemId=${encodeURIComponent(toolId)}&itemType=${itemType}`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.isFavorited === "boolean") setIsFav(data.isFavorited);
      })
      .catch(() => {});
  }, [itemType, status, toolId]);

  const onClick = async () => {
    if (!session?.user) {
      alert("Авторизуйтесь, чтобы использовать избранное");
      const returnTo = callbackUrl || (itemType === "aiTools" ? `/catalog/${toolId}` : `/catalog?type=${itemType}`);
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(returnTo)}`);
      return;
    }

    const nextValue = !isFav;
    setIsFav(nextValue);

    try {
      const response = await fetch("/api/favorites", {
        method: nextValue ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: toolId, itemType }),
      });

      if (!response.ok) throw new Error("Favorite request failed");

      window.dispatchEvent(
        new CustomEvent("library-favorites-updated", {
          detail: { itemId: toolId, itemType, isFavorited: nextValue },
        }),
      );
      startTransition(() => router.refresh());
    } catch {
      setIsFav(!nextValue);
    }
  };

  const label = isFav ? "Убрать из избранного" : "Добавить в избранное";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={label}
      title={label}
      className={cn(
        iconOnly
          ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950",
        isFav
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-black/10 text-black hover:border-black/25 dark:border-white/15 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/10",
        className,
      )}
    >
      <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
      {!iconOnly ? <span>{isFav ? "В избранном" : "Добавить в избранное"}</span> : null}
    </button>
  );
}
