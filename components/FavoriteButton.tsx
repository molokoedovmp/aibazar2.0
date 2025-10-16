'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  toolId: string
  isFavoritedInitial?: boolean
  className?: string
}

export default function FavoriteButton({ toolId, isFavoritedInitial = false, className }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFav, setIsFav] = useState<boolean>(!!isFavoritedInitial)
  const [isPending, startTransition] = useTransition()

  const onClick = async () => {
    if (!session?.user) {
      alert('Авторизуйтесь, чтобы использовать избранное')
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/catalog/${toolId}`)}`)
      return
    }
    try {
      setIsFav((v) => !v)
      const method = !isFav ? 'POST' : 'DELETE'
      await fetch('/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: toolId, itemType: 'aiTools' }),
      })
      startTransition(() => router.refresh())
    } catch {
      // rollback on error
      setIsFav((v) => !v)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950',
        isFav
          ? 'border-red-400 bg-red-500/10 text-red-600 shadow-[0_0_0_1px_rgba(248,113,113,0.35)] dark:border-red-500/50 dark:text-red-300'
          : 'border-black/10 text-black hover:-translate-y-0.5 hover:shadow-lg dark:border-white/15 dark:text-white dark:hover:bg-white/10',
        className
      )}
    >
      <Heart className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
      {isFav ? 'В избранном' : 'Добавить в избранное'}
    </button>
  )
}



