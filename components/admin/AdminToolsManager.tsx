"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, ExternalLink, ImageUp, LoaderCircle, Pencil, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEdgeStore } from "@/lib/edgestore";

type Category = { id: string; name: string; icon: string | null };
type DocumentOption = { id: string; title: string };
type Tool = {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  url: string | null;
  type: string;
  isActive: boolean;
  rating: number | null;
  price: number | null;
  startPrice: number | null;
  linkedDocumentId: string | null;
  categoryId: string;
  category: Category;
};

type ToolForm = {
  name: string;
  description: string;
  coverImage: string;
  url: string;
  type: string;
  isActive: boolean;
  rating: string;
  price: string;
  startPrice: string;
  categoryId: string;
  linkedDocumentId: string;
};

const emptyForm: ToolForm = {
  name: "",
  description: "",
  coverImage: "",
  url: "",
  type: "free",
  isActive: true,
  rating: "",
  price: "",
  startPrice: "",
  categoryId: "",
  linkedDocumentId: "",
};

function toForm(tool: Tool): ToolForm {
  return {
    name: tool.name,
    description: tool.description,
    coverImage: tool.coverImage || "",
    url: tool.url || "",
    type: tool.type,
    isActive: tool.isActive,
    rating: tool.rating?.toString() || "",
    price: tool.price?.toString() || "",
    startPrice: tool.startPrice?.toString() || "",
    categoryId: tool.categoryId,
    linkedDocumentId: tool.linkedDocumentId || "",
  };
}

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function AdminToolsManager({
  initialTools,
  initialCategories,
  documents,
  initialTotal,
}: {
  initialTools: Tool[];
  initialCategories: Category[];
  documents: DocumentOption[];
  initialTotal: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { edgestore } = useEdgeStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [tools, setTools] = useState(initialTools);
  const [total, setTotal] = useState(initialTotal);
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [open, setOpen] = useState(searchParams.get("create") === "1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ToolForm>({ ...emptyForm, categoryId: initialCategories[0]?.id || "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(Math.max(1, Math.ceil(initialTotal / 30)));
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingList(true);
      const params = new URLSearchParams({ page: String(page), includeInactive: String(showInactive) });
      if (query.trim()) params.set("q", query.trim());
      try {
        const response = await fetch(`/api/admin/tools?${params}`, { signal: controller.signal });
        const payload = await response.json();
        if (response.ok) {
          setTools(payload.tools);
          setTotal(payload.total);
          setPages(payload.pages);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingList(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, query, showInactive]);

  function update<K extends keyof ToolForm>(key: K, value: ToolForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
    setMessage("");
    setOpen(true);
  }

  function startEdit(tool: Tool) {
    setEditingId(tool.id);
    setForm(toForm(tool));
    setMessage("");
    setOpen(true);
  }

  function closeDialog(next: boolean) {
    setOpen(next);
    if (!next && searchParams.get("create")) router.replace("/account/admin/tools");
  }

  async function uploadCover(file: File) {
    setUploading(true);
    setMessage("");
    try {
      const result = await edgestore.toolImages.upload({ file });
      update("coverImage", result.url);
    } catch {
      setMessage("Не удалось загрузить изображение. Проверьте формат и попробуйте снова.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function createCategory() {
    if (categoryName.trim().length < 2) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось создать категорию");
      setCategories((current) => [...current, payload.category].sort((a, b) => a.name.localeCompare(b.name, "ru")));
      update("categoryId", payload.category.id);
      setCategoryName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось создать категорию");
    } finally {
      setSaving(false);
    }
  }

  async function saveTool() {
    setSaving(true);
    setMessage("");
    const body = {
      ...form,
      rating: optionalNumber(form.rating),
      price: optionalNumber(form.price),
      startPrice: optionalNumber(form.startPrice),
    };

    try {
      const response = await fetch(editingId ? `/api/admin/tools/${editingId}` : "/api/admin/tools", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Не удалось сохранить инструмент");

      setTools((current) => editingId
        ? current.map((tool) => tool.id === editingId ? payload.tool : tool)
        : [payload.tool, ...current].slice(0, 30));
      if (!editingId) setTotal((current) => current + 1);
      closeDialog(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить инструмент");
    } finally {
      setSaving(false);
    }
  }

  async function setToolActive(tool: Tool, isActive: boolean) {
    const response = await fetch(`/api/admin/tools/${tool.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (response.ok) {
      const payload = await response.json();
      setTools((current) => showInactive
        ? current.map((item) => item.id === tool.id ? payload.tool : item)
        : current.filter((item) => item.id !== tool.id));
      if (!showInactive && !isActive) setTotal((current) => Math.max(0, current - 1));
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Поиск по названию, описанию или категории" className="h-11 rounded-xl bg-white pl-10 dark:bg-zinc-900" />
        </div>
        <Button variant="outline" className="h-11 rounded-xl" onClick={() => { setShowInactive((value) => !value); setPage(1); }}>
          {showInactive ? "Скрыть архив" : "Показать архив"}
        </Button>
        <Button className="h-11 rounded-xl" onClick={startCreate}><Plus className="h-4 w-4" /> Добавить инструмент</Button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-black/45 dark:text-white/45">
        <span>{loadingList ? "Загрузка…" : `Показано: ${tools.length}`}</span>
        <span>Найдено: {total}</span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <article key={tool.id} className={`flex min-h-52 flex-col rounded-2xl border bg-white p-4 dark:bg-zinc-900 ${tool.isActive ? "border-black/10 dark:border-white/10" : "border-amber-300/70 opacity-70 dark:border-amber-700/70"}`}>
            <div className="flex gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                {tool.coverImage ? (
                  // External catalog images can come from arbitrary providers.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tool.coverImage} alt="" className="h-full w-full object-cover" />
                ) : <span className="text-lg font-semibold">{tool.name.slice(0, 2).toUpperCase()}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="truncate font-semibold">{tool.name}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${tool.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>{tool.isActive ? "Опубликован" : "В архиве"}</span>
                </div>
                <div className="mt-1 text-xs text-black/45 dark:text-white/45">{tool.category.name} · {tool.type}</div>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-black/55 dark:text-white/55">{tool.description}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
              <div className="text-xs text-black/45 dark:text-white/45">Рейтинг: {tool.rating ?? "—"} · от ${tool.startPrice ?? "—"}</div>
              <div className="flex gap-1">
                {tool.url ? <Button variant="ghost" size="icon" asChild><a href={tool.url} target="_blank" rel="noreferrer" aria-label="Открыть сайт"><ExternalLink className="h-4 w-4" /></a></Button> : null}
                <Button variant="ghost" size="icon" onClick={() => startEdit(tool)} aria-label="Редактировать"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => void setToolActive(tool, !tool.isActive)} aria-label={tool.isActive ? "Архивировать" : "Опубликовать"}><Archive className="h-4 w-4" /></Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {pages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1 || loadingList} onClick={() => setPage((value) => value - 1)}>Назад</Button>
          <span className="text-sm text-black/55 dark:text-white/55">{page} из {pages}</span>
          <Button variant="outline" disabled={page >= pages || loadingList} onClick={() => setPage((value) => value + 1)}>Далее</Button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Редактировать AI-инструмент" : "Новый AI-инструмент"}</DialogTitle>
            <DialogDescription>Заполните данные карточки. Изменения появятся в каталоге сразу после сохранения.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-sm font-medium">Название *</span><Input value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Ссылка на сервис</span><Input type="url" value={form.url} onChange={(event) => update("url", event.target.value)} placeholder="https://..." /></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Описание *</span><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-28" /></label>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Обложка</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={form.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder="URL изображения или загрузите файл" />
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadCover(file); }} />
                <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
                  {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
                  {uploading ? "Загрузка" : "Загрузить"}
                </Button>
              </div>
            </div>

            <label className="space-y-1.5"><span className="text-sm font-medium">Категория *</span>
              <Select value={form.categoryId} onValueChange={(value) => update("categoryId", value)}><SelectTrigger className="w-full"><SelectValue placeholder="Выберите категорию" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>
            </label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Модель доступа</span>
              <Select value={form.type} onValueChange={(value) => update("type", value)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Бесплатно</SelectItem><SelectItem value="freemium">Условно бесплатно</SelectItem><SelectItem value="paid">Платно</SelectItem><SelectItem value="opensource">Open source</SelectItem><SelectItem value="other">Другое</SelectItem></SelectContent></Select>
            </label>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Быстро создать категорию</span>
              <div className="flex gap-2"><Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Название новой категории" /><Button type="button" variant="outline" disabled={saving || categoryName.trim().length < 2} onClick={() => void createCategory()}>Создать</Button></div>
            </div>

            <label className="space-y-1.5"><span className="text-sm font-medium">Рейтинг, 0–10</span><Input type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(event) => update("rating", event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Цена от, USD</span><Input type="number" min="0" step="0.01" value={form.startPrice} onChange={(event) => update("startPrice", event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Цена, ₽</span><Input type="number" min="0" step="1" value={form.price} onChange={(event) => update("price", event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Связанная статья</span>
              <Select value={form.linkedDocumentId || "none"} onValueChange={(value) => update("linkedDocumentId", value === "none" ? "" : value)}><SelectTrigger className="w-full"><SelectValue placeholder="Без статьи" /></SelectTrigger><SelectContent><SelectItem value="none">Без статьи</SelectItem>{documents.map((document) => <SelectItem key={document.id} value={document.id}>{document.title}</SelectItem>)}</SelectContent></Select>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10 sm:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} className="h-4 w-4" /><span><span className="block text-sm font-medium">Опубликовать в каталоге</span><span className="block text-xs text-black/45 dark:text-white/45">Отключите, чтобы сохранить инструмент в архиве.</span></span></label>
          </div>

          {message ? <p className="text-sm text-red-600" role="alert">{message}</p> : null}
          <DialogFooter><Button variant="outline" onClick={() => closeDialog(false)}>Отмена</Button><Button disabled={saving || uploading} onClick={() => void saveTool()}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{editingId ? "Сохранить" : "Добавить инструмент"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
