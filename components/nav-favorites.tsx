"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FileText,
  Link as LinkIcon,
  Loader2,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type SidebarDocument = {
  id: string;
  title: string;
};

type DocumentResponse = {
  id?: string;
  title?: string;
  parentDocument?: string | null;
  isFavorite?: boolean;
};

export function NavFavorites({
  favorites = [],
  documents = [],
}: {
  favorites?: SidebarDocument[];
  documents?: SidebarDocument[];
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const maxVisible = 5;

  const visibleFavorites = showAllFavorites ? favorites : favorites.slice(0, maxVisible);
  const visibleDocuments = showAllDocuments ? documents : documents.slice(0, maxVisible);

  async function addChildDocument(parent: SidebarDocument) {
    const actionKey = `create:${parent.id}`;
    if (pendingAction) return;
    setPendingAction(actionKey);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Новая страница", parentDocument: parent.id }),
      });
      if (!response.ok) throw new Error("Не удалось создать страницу");

      const created = await response.json() as DocumentResponse;
      if (!created.id) return;

      window.dispatchEvent(new CustomEvent("document-updated", {
        detail: {
          id: created.id,
          title: created.title || "Новая страница",
          parentDocument: created.parentDocument ?? parent.id,
          action: "add",
        },
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleFavorite(document: SidebarDocument) {
    const actionKey = `favorite:${document.id}`;
    if (pendingAction) return;
    setPendingAction(actionKey);

    const nextFavorite = !favorites.some((favorite) => favorite.id === document.id);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: nextFavorite }),
      });
      if (!response.ok) throw new Error("Не удалось обновить избранное");

      const updated = await response.json() as DocumentResponse;
      const isFavorite = Boolean(updated.isFavorite);
      window.dispatchEvent(new CustomEvent("favorites-updated", {
        detail: {
          id: document.id,
          title: updated.title || document.title,
          action: isFavorite ? "add" : "remove",
        },
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteDocument(document: SidebarDocument) {
    if (!window.confirm(`Удалить документ «${document.title}»?`)) return;
    const actionKey = `delete:${document.id}`;
    if (pendingAction) return;
    setPendingAction(actionKey);

    try {
      const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Не удалось удалить документ");

      window.dispatchEvent(new CustomEvent("document-updated", {
        detail: { id: document.id, action: "remove" },
      }));
      window.dispatchEvent(new CustomEvent("favorites-updated", {
        detail: { id: document.id, action: "remove" },
      }));

      const currentDocumentId = new URLSearchParams(window.location.search).get("doc");
      if (currentDocumentId === document.id) {
        router.replace("/account/documents");
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      {favorites.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Избранные</SidebarGroupLabel>
          <SidebarMenu>
            {visibleFavorites.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild className="rounded-lg transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm">
                  <Link href={`/account/documents?doc=${item.id}`} title={item.title}>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="max-w-[180px] truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {favorites.length > maxVisible && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="rounded-lg text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
                  onClick={() => setShowAllFavorites((current) => !current)}
                >
                  <MoreHorizontal />
                  <span>{showAllFavorites ? "Скрыть" : "Ещё"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Документы</SidebarGroupLabel>
        <SidebarMenu>
          {visibleDocuments.map((item) => {
            const isFavorite = favorites.some((favorite) => favorite.id === item.id);
            const isBusy = pendingAction?.endsWith(`:${item.id}`);

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild className="rounded-lg transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm">
                  <Link href={`/account/documents?doc=${item.id}`} title={item.title}>
                    <FileText className="h-4 w-4" />
                    <span className="max-w-[180px] truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover disabled={Boolean(isBusy)}>
                      {isBusy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
                      <span className="sr-only">Действия</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 rounded-xl"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem onClick={() => addChildDocument(item)}>
                      <Plus className="text-muted-foreground" />
                      <span>Добавить страницу</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleFavorite(item)}>
                      <Star className={isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                      <span>{isFavorite ? "Убрать из избранного" : "Добавить в избранное"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${location.origin}/account/documents?doc=${item.id}`)}>
                      <LinkIcon className="text-muted-foreground" />
                      <span>Скопировать ссылку</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/account/documents?doc=${item.id}`, "_blank")}>
                      <ArrowUpRight className="text-muted-foreground" />
                      <span>Открыть в новой вкладке</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => deleteDocument(item)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <Trash2 />
                      <span>Удалить</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          })}

          {documents.length > maxVisible && (
            <SidebarMenuItem>
              <SidebarMenuButton
                className="rounded-lg text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
                onClick={() => setShowAllDocuments((current) => !current)}
              >
                <MoreHorizontal />
                <span>{showAllDocuments ? "Скрыть" : "Ещё"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
