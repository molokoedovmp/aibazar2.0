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
  MoreHorizontal,
  Settings2,
  Star,
  Trash,
  Trash2,
} from "lucide-react"

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
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {data.map((group, index) => (
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton>
                            <item.icon /> <span>{item.label}</span>
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
