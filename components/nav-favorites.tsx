"use client"

import Link from "next/link"
import { useState } from "react"

import {
  ArrowUpRight,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  StarOff,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavFavorites({
  favorites = [],
  documents = [],
}: {
  favorites?: { id: string; title: string }[]
  documents?: { id: string; title: string }[]
}) {
  const { isMobile } = useSidebar()
  const MAX_VISIBLE = 5
  const [showAllFavs, setShowAllFavs] = useState(false)
  const [showAllDocs, setShowAllDocs] = useState(false)

  const favsToShow = showAllFavs ? favorites : favorites.slice(0, MAX_VISIBLE)
  const docsToShow = showAllDocs ? documents : documents.slice(0, MAX_VISIBLE)

  return (
    <>
      {favorites.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Избранные</SidebarGroupLabel>
          <SidebarMenu>
            {favsToShow.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild className="rounded-lg transition-all hover:shadow-sm hover:bg-white hover:border hover:border-gray-200">
                  <Link href={`/account/documents?doc=${item.id}`} title={item.title}>
                    <span>⭐</span>
                    <span className="truncate max-w-[180px]">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {favorites.length > MAX_VISIBLE && (
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/70 rounded-lg transition-all hover:shadow-sm hover:bg-white hover:border hover:border-gray-200" onClick={() => setShowAllFavs((v) => !v)}>
                  <MoreHorizontal />
                  <span>{showAllFavs ? "Скрыть" : "Еще"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Документы</SidebarGroupLabel>
        <SidebarMenu>
          {docsToShow.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild className="rounded-lg transition-all hover:shadow-sm hover:bg-white hover:border hover:border-gray-200">
                <Link href={`/account/documents?doc=${item.id}`} title={item.title}>
                  <span>📝</span>
                  <span className="truncate max-w-[180px]">{item.title}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem onClick={async()=>{
                    // Создать дочерний документ
                    try {
                      const res = await fetch('/api/documents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: 'Новая страница', parentDocument: item.id })
                      });
                      const created = await res.json();
                      window.dispatchEvent(new CustomEvent('document-updated', { detail: { id: created?.id, title: created?.title } }));
                    } catch {}
                  }}>
                    <Plus className="text-muted-foreground" />
                    <span>Добавить страницу</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async()=>{
                    try {
                      await fetch(`/api/documents/${item.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isFavorite: true })
                      });
                      window.dispatchEvent(new Event('favorites-updated'))
                    } catch {}
                  }}>
                    <StarOff className="text-muted-foreground" />
                    <span>Добавить Избранное</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async()=>{
                    try {
                      await navigator.clipboard.writeText(`${location.origin}/account/documents?doc=${item.id}`)
                    } catch {}
                  }}>
                    <LinkIcon className="text-muted-foreground" />
                    <span>Скопировать ссылку</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={()=>{
                    window.open(`/account/documents?doc=${item.id}`, '_blank')
                  }}>
                    <ArrowUpRight className="text-muted-foreground" />
                    <span>Открыть в новой вкладке</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async()=>{
                    try {
                      await fetch(`/api/documents/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: true }) })
                      window.dispatchEvent(new CustomEvent('document-updated', { detail: { id: item.id } }))
                    } catch {}
                  }}>
                    <Trash2 className="text-muted-foreground" />
                    <span>Удалить</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
          {documents.length > MAX_VISIBLE && (
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70 rounded-lg transition-all hover:shadow-sm hover:bg-white hover:border hover:border-gray-200" onClick={() => setShowAllDocs((v) => !v)}>
                <MoreHorizontal />
                <span>{showAllDocs ? "Скрыть" : "Еще"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/80 rounded-lg transition-all hover:shadow-sm hover:bg-white hover:border hover:border-gray-200">
              <Link href="/trash">
                <Trash2 />
                <span>Корзина</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
