"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, LoaderCircle, Search, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminDocumentStatus } from "@/lib/admin-documents";

type AdminDocumentItem = {
  id: string;
  title: string;
  userId: string;
  previewText: string | null;
  isPublished: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  parentDocument: string | null;
  createdAt: string;
  updatedAt: string;
  childrenCount: number;
  owner: { id: string; name: string | null; email: string | null; image: string | null } | null;
};

const statusLabels: Record<AdminDocumentStatus, string> = {
  all: "Все документы",
  published: "Опубликованные",
  drafts: "Черновики",
  archived: "В архиве",
};

function documentStatus(document: AdminDocumentItem) {
  if (document.isArchived) return "В архиве";
  if (document.isPublished) return "Опубликован";
  return "Черновик";
}

export function AdminDocumentsManager({
  initialItems,
  initialTotal,
  initialPages,
}: {
  initialItems: AdminDocumentItem[];
  initialTotal: number;
  initialPages: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [pages, setPages] = useState(initialPages);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminDocumentStatus>("all");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminDocumentItem | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");
      try {
        const params = new URLSearchParams({ page: String(page), status });
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch(`/api/admin/documents?${params}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Не удалось загрузить документы");
        setItems(payload.items);
        setTotal(payload.total);
        setPages(payload.pages);
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "Не удалось загрузить документы");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, query, status]);

  async function deleteDocument() {
    if (!selected) return;
    setDeletingId(selected.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/documents/${selected.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось удалить документ");
      setItems((current) => current.filter((item) => item.id !== selected.id));
      setTotal((current) => Math.max(0, current - 1));
      setSelected(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить документ");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
          <Input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Поиск по названию, имени или email владельца"
            className="h-11 rounded-xl bg-white pl-10 dark:bg-zinc-900"
          />
        </div>
        <Select value={status} onValueChange={(value: AdminDocumentStatus) => { setStatus(value); setPage(1); }}>
          <SelectTrigger className="h-11 w-full rounded-xl bg-white sm:w-52 dark:bg-zinc-900"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-black/45 dark:text-white/45">
        <span>{loading ? "Загрузка…" : `Показано: ${items.length}`}</span>
        <span>Найдено: {total.toLocaleString("ru-RU")}</span>
      </div>
      {message ? <p className="mt-3 text-sm text-red-600" role="alert">{message}</p> : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="hidden grid-cols-[minmax(260px,1fr)_minmax(220px,0.8fr)_150px_130px_52px] gap-4 border-b border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black/40 dark:border-white/10 dark:text-white/40 lg:grid">
          <span>Документ</span><span>Владелец</span><span>Обновлён</span><span>Статус</span><span />
        </div>
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {items.map((document) => {
            const ownerLabel = document.owner?.name || document.owner?.email || "Удалённый пользователь";
            return (
              <article key={document.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,0.8fr)_150px_130px_52px] lg:items-center lg:px-5">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate font-medium">{document.title || "Без названия"}</h2>
                    <p className="mt-1 line-clamp-1 text-xs text-black/45 dark:text-white/45">{document.previewText || document.id}</p>
                    {document.childrenCount ? <p className="mt-1 text-[10px] text-black/35 dark:text-white/35">Вложенных документов: {document.childrenCount}</p> : null}
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarImage src={document.owner?.image || undefined} /><AvatarFallback>{ownerLabel[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0"><div className="truncate text-sm font-medium">{ownerLabel}</div><div className="truncate text-xs text-black/45 dark:text-white/45">{document.owner?.email || document.userId}</div></div>
                </div>
                <div className="text-sm text-black/65 dark:text-white/65"><span className="mr-2 text-xs text-black/40 lg:hidden">Обновлён:</span>{new Intl.DateTimeFormat("ru-RU").format(new Date(document.updatedAt))}</div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${document.isArchived ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : document.isPublished ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60"}`}>{documentStatus(document)}</span>
                  {document.isPublished ? <Button variant="ghost" size="icon" asChild><a href={`/blog/${document.id}`} target="_blank" rel="noreferrer" aria-label="Открыть опубликованную статью"><ExternalLink className="h-4 w-4" /></a></Button> : null}
                </div>
                <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950" onClick={() => setSelected(document)} aria-label={`Удалить ${document.title}`}><Trash2 className="h-4 w-4" /></Button>
              </article>
            );
          })}
        </div>
      </div>

      {!items.length && !loading ? <div className="mt-3 rounded-2xl border border-dashed border-black/15 p-12 text-center text-sm text-black/45 dark:border-white/15 dark:text-white/45">Документы не найдены</div> : null}
      {pages > 1 ? <div className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Назад</Button><span className="text-sm text-black/55 dark:text-white/55">{page} из {pages}</span><Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)}>Далее</Button></div> : null}

      <AlertDialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !deletingId) setSelected(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить документ без возможности восстановления?</AlertDialogTitle>
            <AlertDialogDescription>
              Документ «{selected?.title || "Без названия"}» пользователя {selected?.owner?.email || selected?.owner?.name || selected?.userId} будет удалён окончательно. Вложенные документы останутся и переместятся на верхний уровень.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>Отмена</AlertDialogCancel>
            <AlertDialogAction disabled={Boolean(deletingId)} className="bg-red-600 text-white hover:bg-red-700" onClick={(event) => { event.preventDefault(); void deleteDocument(); }}>
              {deletingId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
