"use client";

import { useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  author: string;
  content: string;
  rating: number;
  createdAt: string;
};

export default function Reviews({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [count, setCount] = useState<number>(0);

  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews?documentId=${encodeURIComponent(documentId)}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setAvgRating(data.avgRating ?? 0);
      setCount(data.count ?? 0);
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки отзывов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, author, content, rating }),
      });
      if (!res.ok) throw new Error("Не удалось отправить отзыв");
      setAuthor("");
      setContent("");
      setRating(10);
      await reload();
    } catch (e: any) {
      setError(e?.message || "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black dark:text-white">Отзывы</h3>
        <div className="text-sm text-black/70 dark:text-white/70">
          {count > 0 ? (
            <span>
              ⭐ {avgRating.toFixed(1)}/10 • {count} {count === 1 ? "отзыв" : count < 5 ? "отзыва" : "отзывов"}
            </span>
          ) : (
            <span>Пока нет отзывов</span>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-black/10 dark:border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Ваше имя (необязательно)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40"
          />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-32 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm text-black dark:text-white"
          >
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{`Оценка: ${r}/10`}</option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Комментарий"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40"
        />
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Отправка..." : "Оставить отзыв"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-sm text-black/60 dark:text-white/60">Загрузка...</div>
        ) : reviews.length === 0 ? (
          <div className="text-sm text-black/60 dark:text-white/60">Пока нет отзывов — станьте первым!</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-black/10 dark:border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-black dark:text-white">{r.author || "Аноним"}</div>
                <div className="text-xs text-black/60 dark:text-white/60">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-1 text-yellow-500">{"⭐".repeat(r.rating)}</div>
              <div className="mt-2 text-sm text-black/80 dark:text-white/80 whitespace-pre-wrap">{r.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
