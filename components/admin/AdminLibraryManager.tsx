"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, ExternalLink, ImageUp, LoaderCircle, Pencil, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminLibraryType } from "@/lib/admin-library-validation";
import { useEdgeStore } from "@/lib/edgestore";
import { ToolImage } from "@/app/components/ToolImage";

export type AdminLibraryItem = {
  id: string;
  name?: string;
  title?: string;
  titleRu?: string | null;
  description?: string | null;
  descriptionRu?: string | null;
  content?: string;
  author?: string | null;
  authorName?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  resourceType?: string;
  languageName?: string | null;
  tags?: string[];
  categoryNames?: string[];
  rating?: number | null;
  stars?: number | null;
  location?: string | null;
  license?: string | null;
  isOfficial?: boolean;
  sourceKind?: string;
  isPublic?: boolean;
  repoUrl?: string | null;
  sourceLanguage?: string | null;
  installCommand?: string | null;
  compatibleAgents?: string[];
  category?: string | null;
  owner?: string | null;
  repositoryName?: string | null;
  url?: string;
  language?: string | null;
  coverImages?: string[];
  isActive: boolean;
};

type ResourceForm = {
  name: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  content: string;
  author: string;
  githubUrl: string;
  websiteUrl: string;
  resourceType: string;
  languageName: string;
  tags: string;
  categoryNames: string;
  rating: string;
  stars: string;
  location: string;
  license: string;
  isOfficial: boolean;
  sourceKind: string;
  isPublic: boolean;
  repoUrl: string;
  installCommand: string;
  compatibleAgents: string;
  category: string;
  owner: string;
  repositoryName: string;
  url: string;
  coverImages: string[];
  isActive: boolean;
};

const labels: Record<AdminLibraryType, { one: string; many: string; button: string }> = {
  mcp: { one: "MCP-сервер", many: "MCP-серверов", button: "Добавить MCP" },
  prompts: { one: "промпт", many: "промптов", button: "Добавить промпт" },
  skills: { one: "навык", many: "навыков", button: "Добавить навык" },
  repos: { one: "репозиторий", many: "репозиториев", button: "Добавить репозиторий" },
};

function emptyForm(type: AdminLibraryType): ResourceForm {
  return {
    name: "", titleRu: "", description: "", descriptionRu: "", content: "", author: "",
    githubUrl: "", websiteUrl: "", resourceType: "MCP Server", languageName: "", tags: "",
    categoryNames: "", rating: "", stars: "", location: "Local", license: "", isOfficial: false,
    sourceKind: "Авторский", isPublic: true, repoUrl: "", installCommand: "", compatibleAgents: "",
    category: "", owner: "", repositoryName: "", url: "", coverImages: [], isActive: true,
    ...(type === "repos" ? { githubUrl: "" } : {}),
  };
}

function list(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function itemName(item: AdminLibraryItem) {
  return item.titleRu || item.title || item.name || "Без названия";
}

function itemDescription(item: AdminLibraryItem) {
  return item.descriptionRu || item.description || "Описание не добавлено";
}

function formFromItem(item: AdminLibraryItem): ResourceForm {
  return {
    ...emptyForm("mcp"),
    name: item.title || item.name || "",
    titleRu: item.titleRu || "",
    description: item.description || "",
    descriptionRu: item.descriptionRu || "",
    content: item.content || "",
    author: item.author || item.authorName || "",
    githubUrl: item.githubUrl || "",
    websiteUrl: item.websiteUrl || "",
    resourceType: item.resourceType || "MCP Server",
    languageName: item.languageName || item.sourceLanguage || item.language || "",
    tags: item.tags?.join(", ") || "",
    categoryNames: item.categoryNames?.join(", ") || "",
    rating: item.rating?.toString() || "",
    stars: item.stars?.toString() || "",
    location: item.location || "",
    license: item.license || "",
    isOfficial: item.isOfficial || false,
    sourceKind: item.sourceKind || "Авторский",
    isPublic: item.isPublic ?? true,
    repoUrl: item.repoUrl || "",
    installCommand: item.installCommand || "",
    compatibleAgents: item.compatibleAgents?.join(", ") || "",
    category: item.category || "",
    owner: item.owner || "",
    repositoryName: item.repositoryName || "",
    url: item.url || "",
    coverImages: item.coverImages || [],
    isActive: item.isActive,
  };
}

function TextField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="space-y-1.5"><span className="text-sm font-medium">{label}</span><Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function AreaField({ label, value, onChange, tall = false }: { label: string; value: string; onChange: (value: string) => void; tall?: boolean }) {
  return <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">{label}</span><Textarea value={value} onChange={(event) => onChange(event.target.value)} className={tall ? "min-h-52 font-mono text-sm" : "min-h-24"} /></label>;
}

export function AdminLibraryManager({ type, initialItems, initialTotal }: { type: AdminLibraryType; initialItems: AdminLibraryItem[]; initialTotal: number }) {
  const { edgestore } = useEdgeStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(Math.max(1, Math.ceil(initialTotal / 30)));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>(() => emptyForm(type));
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type, page: String(page), includeInactive: String(includeInactive) });
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch(`/api/admin/library?${params}`, { signal: controller.signal });
        const payload = await response.json();
        if (response.ok) {
          setItems(payload.items);
          setTotal(payload.total);
          setPages(payload.pages);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [includeInactive, page, query, type]);

  function update<K extends keyof ResourceForm>(key: K, value: ResourceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function createItem() {
    setEditingId(null);
    setForm(emptyForm(type));
    setMessage("");
    setOpen(true);
  }

  function editItem(item: AdminLibraryItem) {
    setEditingId(item.id);
    setForm(formFromItem(item));
    setMessage("");
    setOpen(true);
  }

  function payload() {
    if (type === "mcp") return {
      name: form.name, description: form.description, author: form.author, githubUrl: form.githubUrl,
      websiteUrl: form.websiteUrl, resourceType: form.resourceType, languageName: form.languageName,
      tags: list(form.tags), categoryNames: list(form.categoryNames), rating: numberOrNull(form.rating),
      stars: numberOrNull(form.stars), location: form.location, license: form.license,
      isOfficial: form.isOfficial, isActive: form.isActive, coverImages: form.coverImages,
    };
    if (type === "prompts") return {
      title: form.name, titleRu: form.titleRu, description: form.description, descriptionRu: form.descriptionRu,
      content: form.content, tags: list(form.tags), authorName: form.author, sourceKind: form.sourceKind,
      rating: numberOrNull(form.rating) ?? 0, isPublic: form.isPublic, isActive: form.isActive, coverImages: form.coverImages,
    };
    if (type === "skills") return {
      name: form.name, description: form.description, descriptionRu: form.descriptionRu, author: form.author,
      repoUrl: form.repoUrl, stars: numberOrNull(form.stars), sourceLanguage: form.languageName,
      installCommand: form.installCommand, compatibleAgents: list(form.compatibleAgents), category: form.category,
      tags: list(form.tags), isOfficial: form.isOfficial, isActive: form.isActive, coverImages: form.coverImages,
    };
    return {
      name: form.name, owner: form.owner, repositoryName: form.repositoryName, description: form.description,
      descriptionRu: form.descriptionRu, url: form.url, language: form.languageName,
      stars: numberOrNull(form.stars), isActive: form.isActive, coverImages: form.coverImages,
    };
  }

  async function uploadCovers(files: FileList) {
    const available = Math.max(0, 8 - form.coverImages.length);
    const selected = Array.from(files).slice(0, available);
    if (!selected.length) {
      setMessage("Можно добавить не больше 8 обложек.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      for (const file of selected) {
        const result = await edgestore.toolImages.upload({ file });
        setForm((current) => ({ ...current, coverImages: [...current.coverImages, result.url] }));
      }
    } catch {
      setMessage("Не удалось загрузить одну из обложек. Проверьте формат и размер файла.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function removeCover(index: number) {
    setForm((current) => ({ ...current, coverImages: current.coverImages.filter((_, currentIndex) => currentIndex !== index) }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const endpoint = editingId ? `/api/admin/library/${type}/${editingId}` : `/api/admin/library?type=${type}`;
      const response = await fetch(endpoint, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить ресурс");
      setItems((current) => editingId ? current.map((item) => item.id === editingId ? result.item : item) : [result.item, ...current].slice(0, 30));
      if (!editingId) setTotal((current) => current + 1);
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить ресурс");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(item: AdminLibraryItem, isActive: boolean) {
    const response = await fetch(`/api/admin/library/${type}/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    if (!response.ok) return;
    const result = await response.json();
    setItems((current) => includeInactive ? current.map((currentItem) => currentItem.id === item.id ? result.item : currentItem) : current.filter((currentItem) => currentItem.id !== item.id));
    if (!includeInactive && !isActive) setTotal((current) => Math.max(0, current - 1));
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 dark:text-white/35" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`Поиск ${labels[type].many}`} className="h-11 rounded-xl bg-white pl-10 dark:bg-zinc-900" /></div>
        <Button variant="outline" className="h-11 rounded-xl" onClick={() => { setIncludeInactive((value) => !value); setPage(1); }}>{includeInactive ? "Скрыть архив" : "Показать архив"}</Button>
        <Button className="h-11 rounded-xl" onClick={createItem}><Plus className="h-4 w-4" />{labels[type].button}</Button>
      </div>

      <div className="mt-4 flex justify-between text-xs text-black/45 dark:text-white/45"><span>{loading ? "Загрузка…" : `Показано: ${items.length}`}</span><span>Найдено: {total}</span></div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const link = item.githubUrl || item.websiteUrl || item.repoUrl || item.url;
          return (
            <article key={item.id} className={`flex min-h-52 flex-col rounded-2xl border bg-white p-4 dark:bg-zinc-900 ${item.isActive ? "border-black/10 dark:border-white/10" : "border-amber-300/70 opacity-70 dark:border-amber-700/70"}`}>
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40 dark:text-white/40">{labels[type].one}</div><h2 className="mt-2 line-clamp-2 font-semibold">{itemName(item)}</h2></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${item.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>{item.isActive ? "Опубликован" : "В архиве"}</span></div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/55 dark:text-white/55">{itemDescription(item)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{item.tags?.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-black/5 px-2 py-1 text-[10px] dark:bg-white/5">{tag}</span>)}</div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-5"><span className="text-xs text-black/45 dark:text-white/45">{item.stars != null ? `★ ${item.stars.toLocaleString("ru-RU")}` : item.rating != null ? `Рейтинг ${item.rating}` : item.author || item.authorName || item.owner || "Ручное добавление"}</span><div className="flex gap-1">{link ? <Button variant="ghost" size="icon" asChild><a href={link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button> : null}<Button variant="ghost" size="icon" onClick={() => editItem(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void setActive(item, !item.isActive)}><Archive className="h-4 w-4" /></Button></div></div>
            </article>
          );
        })}
      </div>

      {!items.length && !loading ? <div className="mt-3 rounded-2xl border border-dashed border-black/15 p-12 text-center text-sm text-black/45 dark:border-white/15 dark:text-white/45">Ничего не найдено</div> : null}
      {pages > 1 ? <div className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Назад</Button><span className="text-sm text-black/55 dark:text-white/55">{page} из {pages}</span><Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)}>Далее</Button></div> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{editingId ? `Редактировать ${labels[type].one}` : labels[type].button}</DialogTitle><DialogDescription>Поля этой формы соответствуют данным выбранного раздела каталога.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={type === "prompts" ? "Название промпта *" : "Название *"} value={form.name} onChange={(value) => update("name", value)} />
            {type === "prompts" ? <TextField label="Название на русском" value={form.titleRu} onChange={(value) => update("titleRu", value)} /> : <TextField label={type === "repos" ? "Владелец" : "Автор"} value={form.author || form.owner} onChange={(value) => type === "repos" ? update("owner", value) : update("author", value)} />}

            <AreaField label={type === "prompts" ? "Краткое описание" : "Описание *"} value={form.description} onChange={(value) => update("description", value)} />
            {(type === "prompts" || type === "skills" || type === "repos") ? <AreaField label="Описание на русском" value={form.descriptionRu} onChange={(value) => update("descriptionRu", value)} /> : null}
            {type === "prompts" ? <AreaField label="Текст промпта *" value={form.content} onChange={(value) => update("content", value)} tall /> : null}

            {type === "mcp" ? <><TextField label="GitHub" type="url" value={form.githubUrl} onChange={(value) => update("githubUrl", value)} placeholder="https://github.com/..." /><TextField label="Сайт" type="url" value={form.websiteUrl} onChange={(value) => update("websiteUrl", value)} placeholder="https://..." /><TextField label="Тип" value={form.resourceType} onChange={(value) => update("resourceType", value)} /><TextField label="Язык" value={form.languageName} onChange={(value) => update("languageName", value)} /><TextField label="Направления через запятую" value={form.categoryNames} onChange={(value) => update("categoryNames", value)} /><TextField label="Расположение" value={form.location} onChange={(value) => update("location", value)} /><TextField label="Лицензия" value={form.license} onChange={(value) => update("license", value)} /></> : null}
            {type === "prompts" ? <><TextField label="Автор" value={form.author} onChange={(value) => update("author", value)} /><TextField label="Категория" value={form.sourceKind} onChange={(value) => update("sourceKind", value)} /></> : null}
            {type === "skills" ? <><TextField label="GitHub" type="url" value={form.repoUrl} onChange={(value) => update("repoUrl", value)} /><TextField label="Язык" value={form.languageName} onChange={(value) => update("languageName", value)} /><TextField label="Категория" value={form.category} onChange={(value) => update("category", value)} /><TextField label="Совместимые агенты через запятую" value={form.compatibleAgents} onChange={(value) => update("compatibleAgents", value)} /><AreaField label="Команда или инструкция установки" value={form.installCommand} onChange={(value) => update("installCommand", value)} /></> : null}
            {type === "repos" ? <><TextField label="Ссылка на репозиторий *" type="url" value={form.url} onChange={(value) => update("url", value)} /><TextField label="Название репозитория" value={form.repositoryName} onChange={(value) => update("repositoryName", value)} /><TextField label="Язык" value={form.languageName} onChange={(value) => update("languageName", value)} /></> : null}

            {type !== "repos" ? <TextField label="Теги через запятую" value={form.tags} onChange={(value) => update("tags", value)} /> : null}
            {(type === "mcp" || type === "prompts") ? <TextField label="Рейтинг" type="number" value={form.rating} onChange={(value) => update("rating", value)} /> : null}
            {(type === "mcp" || type === "skills" || type === "repos") ? <TextField label="Звёзды GitHub" type="number" value={form.stars} onChange={(value) => update("stars", value)} /> : null}

            <div className="space-y-3 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-sm font-medium">Обложки для ленты</p><p className="text-xs text-black/45 dark:text-white/45">До 8 изображений. В каталоге они отображаться не будут.</p></div>
                <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => { if (event.target.files) void uploadCovers(event.target.files); }} />
                <Button type="button" variant="outline" disabled={uploading || form.coverImages.length >= 8} onClick={() => fileInput.current?.click()}>
                  {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
                  {uploading ? "Загрузка…" : "Добавить изображения"}
                </Button>
              </div>
              {form.coverImages.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{form.coverImages.map((image, index) => <div key={`${image}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5"><ToolImage src={image} alt={`Обложка ${index + 1}`} className="h-full w-full object-cover" /><button type="button" aria-label="Удалить обложку" onClick={() => removeCover(index)} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><X className="h-4 w-4" /></button></div>)}</div> : <div className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-xs text-black/40 dark:border-white/15 dark:text-white/40">Обложки пока не добавлены</div>}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="flex items-center gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"><input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} /><span className="text-sm font-medium">Опубликовать в каталоге</span></label>
              {type === "prompts" ? <label className="flex items-center gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"><input type="checkbox" checked={form.isPublic} onChange={(event) => update("isPublic", event.target.checked)} /><span className="text-sm font-medium">Публичный промпт</span></label> : null}
              {(type === "mcp" || type === "skills") ? <label className="flex items-center gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"><input type="checkbox" checked={form.isOfficial} onChange={(event) => update("isOfficial", event.target.checked)} /><span className="text-sm font-medium">Официальный ресурс</span></label> : null}
            </div>
          </div>
          {message ? <p className="text-sm text-red-600" role="alert">{message}</p> : null}
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button><Button disabled={saving || uploading} onClick={() => void save()}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Сохранить</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
