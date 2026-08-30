"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    iconClassName?: string
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={item.isActive}
            className="h-auto min-h-11 rounded-xl py-1.5 transition-all hover:border hover:border-gray-200 hover:bg-white hover:shadow-sm"
          >
            <Link href={item.url}>
              <span
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br text-white shadow-md ring-1 ring-black/5 ${item.iconClassName || "from-zinc-600 via-zinc-900 to-black"}`}
              >
                <span className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />
                <item.icon className="relative z-10 h-4 w-4" strokeWidth={2.2} />
              </span>
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
