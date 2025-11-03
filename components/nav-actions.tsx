"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  FileText,
  GalleryVerticalEnd,
  LineChart,
  Link,
  Loader2,
  MoreHorizontal,
  Search,
  Settings2,
  Star,
  Trash,
  Trash2,
} from "lucide-react"
import NextLink from "next/link"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"

const data = [
  [
    {
      label: "Опубликовавать",
      icon: Settings2,
    },
    {
      label: "Turn into wiki",
      icon: FileText,
    },
  ],
  [
    {
      label: "Copy Link",
      icon: Link,
    },
    {
      label: "Duplicate",
      icon: Copy,
    },
    {
      label: "Move to",
      icon: CornerUpRight,
    },
    {
      label: "Move to Trash",
      icon: Trash2,
    },
  ],
  [
    {
      label: "Undo",
      icon: CornerUpLeft,
    },
    {
      label: "View analytics",
      icon: LineChart,
    },
    {
      label: "Version History",
      icon: GalleryVerticalEnd,
    },
    {
      label: "Show delete pages",
      icon: Trash,
    },
    {
      label: "Notifications",
      icon: Bell,
    },
  ],
  [
    {
      label: "Import",
      icon: ArrowUp,
    },
    {
      label: "Export",
      icon: ArrowDown,
    },
  ],
]

export function NavActions({ docId, initialTitle, initialFavorite, initialUpdatedAt, initialPublished }: { docId?: string; initialTitle?: string; initialFavorite?: boolean; initialUpdatedAt?: string; initialPublished?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<Date | null>(initialUpdatedAt ? new Date(initialUpdatedAt) : null)
  const [isFavorite, setIsFavorite] = React.useState(!!initialFavorite)
  const [title, setTitle] = React.useState(initialTitle || "")
  const [isPublished, setIsPublished] = React.useState(!!initialPublished)
  const [documents, setDocuments] = React.useState<Array<{ id: string; title: string; updatedAt?: string | null }>>([])
  const [docsFetched, setDocsFetched] = React.useState(false)
  const [docsLoading, setDocsLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Initialize popover open state
  React.useEffect(() => {
    setIsOpen(true)
  }, [])

  // Sync internal state when route/doc changes
  React.useEffect(() => {
    setTitle(initialTitle || "")
    setIsFavorite(!!initialFavorite)
    setSavedAt(initialUpdatedAt ? new Date(initialUpdatedAt) : null)
    setIsPublished(!!initialPublished)
  }, [docId, initialTitle, initialFavorite, initialUpdatedAt, initialPublished])

  // Sync with external favorite updates
  React.useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail as { id?: string; action?: 'add'|'remove' } | undefined
      if (!d?.id || d.id !== docId) return
      setIsFavorite(d.action === 'add')
    }
    window.addEventListener('favorites-updated', handler as unknown as EventListener)
    return () => window.removeEventListener('favorites-updated', handler as unknown as EventListener)
  }, [docId])

  // Listen to saves and title changes
  React.useEffect(() => {
    const onDocUpdated = (e: any) => {
      const detail = e?.detail as { id?: string; title?: string; updatedAt?: string } | undefined
      if (!detail?.id || detail.id !== docId) return
      if (detail.updatedAt) setSavedAt(new Date(detail.updatedAt))
      if (detail.title) setTitle(detail.title)
    }
    window.addEventListener('document-updated', onDocUpdated as unknown as EventListener)
    return () => window.removeEventListener('document-updated', onDocUpdated as unknown as EventListener)
  }, [docId])

  // Keep lightweight document directory for search
  React.useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail as { id?: string; title?: string; updatedAt?: string } | undefined
      if (!detail?.id) return
      setDocuments((prev) => {
        const idx = prev.findIndex((doc) => doc.id === detail.id)
        if (idx === -1) {
          const next = [{ id: detail.id!, title: detail.title || "Документ", updatedAt: detail.updatedAt }, ...prev]
          return next.slice(0, 50)
        }
        const clone = [...prev]
        clone[idx] = {
          ...clone[idx],
          title: detail.title ?? clone[idx].title,
          updatedAt: detail.updatedAt ?? clone[idx].updatedAt,
        }
        return clone
      })
    }
    window.addEventListener("document-updated", handler as unknown as EventListener)
    return () => window.removeEventListener("document-updated", handler as unknown as EventListener)
  }, [])

  React.useEffect(() => {
    if (!isOpen || docsLoading || docsFetched) return
    let active = true
    setDocsLoading(true)
    fetch("/api/documents", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load documents"))))
      .then((data) => {
        if (!active || !Array.isArray(data)) return
        setDocuments(
          data
            .map((doc: any) => ({
              id: doc?.id,
              title: doc?.title || "Документ",
              updatedAt: typeof doc?.updatedAt === "string" ? doc.updatedAt : doc?.updatedAt?.toString?.() ?? null,
            }))
            .filter((doc: any) => !!doc.id)
        )
        setDocsFetched(true)
      })
      .catch(() => {
        if (!active) return
        setDocsFetched(false)
      })
      .finally(() => {
        if (!active) return
        setDocsLoading(false)
      })
    return () => {
      active = false
    }
  }, [isOpen, docsFetched, docsLoading])

  const formatDocUpdated = React.useCallback((value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    try {
      return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
    } catch {
      return date.toISOString().slice(5, 10)
    }
  }, [])

  const filteredDocuments = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return []
    return documents
      .filter((doc) => doc.title.toLowerCase().includes(query))
      .slice(0, 12)
  }, [documents, searchTerm])

  const shouldShowSearchResults = Boolean(searchTerm.trim())

  async function toggleFavorite() {
    if (!docId) return
    try {
      const next = !isFavorite
      await fetch(`/api/documents/${docId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFavorite: next }) })
      setIsFavorite(next)
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: { id: docId, title, action: next ? 'add' : 'remove' } }))
    } catch {}
  }

  async function publish() {
    if (!docId) return
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      })
      if (!res.ok) return
      const json = await res.json().catch(() => null)
      setIsPublished(true)
      if (json?.updatedAt) setSavedAt(new Date(json.updatedAt))
      // оповестим остальной UI
      window.dispatchEvent(new CustomEvent('document-updated', { detail: { id: docId, title, updatedAt: json?.updatedAt } }))
    } catch {}
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-muted-foreground font-medium">
        {`Сохранено: ${savedAt ? savedAt.toLocaleTimeString() : '—'}`}
      </div>
      {!isPublished ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-green-700 hover:text-green-800 hover:bg-green-50"
          onClick={publish}
          title="Опубликовать статью"
        >
          Опубликовать
        </Button>
      ) : (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Опубликовано</span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${isFavorite ? 'text-yellow-500' : ''}`}
        aria-pressed={isFavorite}
        onClick={toggleFavorite}
        title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
      >
        <Star className={isFavorite ? 'text-yellow-500' : ''} fill={isFavorite ? 'currentColor' : 'none'} />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="data-[state=open]:bg-accent h-7 w-7"
          >
            <MoreHorizontal />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 overflow-hidden rounded-lg p-0"
          align="end"
        >
          <div className="border-b border-gray-100 bg-white/70 p-3">
            
            {shouldShowSearchResults && (
              <div className="mt-3 max-h-60 space-y-1 overflow-auto">
                {docsLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-200 px-3 py-4 text-xs text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    Загрузка...
                  </div>
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => {
                    const updatedLabel = formatDocUpdated(doc.updatedAt)
                    return (
                      <NextLink
                        key={doc.id}
                        href={`/account/documents?doc=${doc.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-xs text-gray-700 transition hover:border-gray-200 hover:bg-gray-50"
                      >
                        <span className="truncate">{doc.title}</span>
                        {updatedLabel && (
                          <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
                            {updatedLabel}
                          </span>
                        )}
                      </NextLink>
                    )
                  })
                ) : (
                  <div className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-500">
                    Документы не найдены
                  </div>
                )}
              </div>
            )}
          </div>
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group, index) => (
                <SidebarGroup key={index} className="border-b border-gray-100 px-2.5 py-1.5 last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu className="gap-1">
                      {group.map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton
                            size="sm"
                            className="h-7 rounded-md px-2 text-xs hover:shadow-sm [&>svg]:h-3.5 [&>svg]:w-3.5"
                          >
                            <item.icon className="h-3.5 w-3.5" /> <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  )
}
