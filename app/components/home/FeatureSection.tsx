"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronRight, Star, ExternalLink, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PaymentDialog } from "@/components/payment-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Tool {
  id: string
  name: string
  description: string
  coverImage?: string | null
  categoryId?: string
  url?: string | null
  rating?: number | null
  price?: number | null
  startPrice?: number | null
}

function SkeletonFeature() {
  return (
    <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 animate-pulse"></div>
    </div>
  )
}

function SkeletonTab() {
  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

export default function FeaturePage() {
  const [activeTab, setActiveTab] = useState(0)
  const [aiTools, setAiTools] = useState<Tool[] | undefined>(undefined)
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [mobileIndex, setMobileIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Загрузка через наш API (Postgres / Prisma)
  useEffect(() => {
    let active = true
    fetch('/api/ai-tools')
      .then(r => r.json())
      .then((data) => {
        const list: Tool[] = (data?.success ? data.data : data) || []
        if (active) setAiTools(list)
      })
      .catch(() => setAiTools([]))
    return () => { active = false }
  }, [])

  // Отслеживаем активный слайд по скроллу
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const onScroll = () => {
      const cards = mobileCardRefs.current
      if (!cards || cards.length === 0) return
      // Находим карточку, которая ближе всего к центру контейнера
      const containerCenter = container.scrollLeft + container.clientWidth / 2
      let closestIndex = 0
      let closestDelta = Infinity
      cards.forEach((el, idx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const elCenter = rect.left - containerRect.left + rect.width / 2 + container.scrollLeft
        const delta = Math.abs(elCenter - containerCenter)
        if (delta < closestDelta) {
          closestDelta = delta
          closestIndex = idx
        }
      })
      setMobileIndex(closestIndex)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    // начальная установка
    onScroll()
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  const toolsToShow = aiTools
    ? aiTools
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 4)
    : []

  const formatPrice = (price?: number) => {
    if (price === undefined || price === 0) return 'Бесплатно'
    return `${price.toLocaleString('ru-RU')} ₽`
  }

  if (!aiTools || toolsToShow.length === 0) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <SkeletonFeature />
          <div className="space-y-6">
            {[0, 1, 2, 3].map((index) => (
              <SkeletonTab key={index} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-6 md:px-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Наиболее популярные AI
          </h2>
          <p className="max-w-3xl text-lg md:text-xl mx-auto text-gray-700 dark:text-gray-300 mt-3">
            Откройте для себя новейшие и самые инновационные инструменты и сервисы искусственного интеллекта.
          </p>
        </div>
        <div className="w-full">
      {/* Mobile carousel */}
      <div className="md:hidden">
        <div className="px-4">
          <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-4 px-4">
            {toolsToShow.map((tool, index) => (
              <div
                key={tool.id}
                ref={(el) => { mobileCardRefs.current[index] = el }}
                className="snap-center shrink-0 w-[85%] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 relative"
              >
                <div className="relative h-[360px] w-full">
                  <Image src={tool.coverImage || "/default.png"} alt={tool.name} fill className="object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60">
                    <h3 className="text-xl font-bold text-white mb-1">{tool.name}</h3>
                    <p className="text-white/80 text-sm line-clamp-2 mb-3">{tool.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3 py-1 rounded-full shadow-lg">
                        <span className="text-xs font-semibold text-white">{formatPrice(tool.price ?? undefined)}</span>
                      </div>
                      <div className="flex items-center bg-white/90 px-2 py-1 rounded-full">
                        <Star className="h-4 w-4 text-black mr-1" />
                        <span className="text-black">{tool.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3">
                      {tool.price && tool.price > 0 ? (
                        <PaymentDialog priceRub={tool.price ?? null} title="aitools" tool={tool}>
                          <Button className="bg-white text-black hover:bg-gray-200">
                            <ShoppingCart className="h-4 w-4 mr-2" />Купить
                          </Button>
                        </PaymentDialog>
                      ) : null}
                      <Button variant="outline" className="bg-white border-gray-300 text-black hover:bg-gray-100" asChild>
                        <Link href={tool.url || '#'} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />Смотреть
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-2">
            {toolsToShow.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setMobileIndex(i)
                  mobileCardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                }}
                className={`h-2 w-2 rounded-full ${mobileIndex === i ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}
                aria-label={`Показать ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {toolsToShow.map((tool, index) => (
            <motion.div
              key={tool.id}
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: activeTab === index ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: activeTab === index ? "block" : "none" }}
            >
              <Image src={tool.coverImage || "/default.png"} alt={tool.name} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/70 dark:bg-black/90">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-bold text-white dark:text-white">
                    {tool.name}
                  </h3>
                  <div className="flex items-center bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                    <Star className="h-4 w-4 text-black dark:text-white mr-1" />
                    <span className="text-black dark:text-white">{typeof tool.rating === 'number' ? tool.rating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
                <p className="text-gray-200 dark:text-gray-300 mb-4">
                  {tool.description}
                </p>
                {/* Обновлённый блок отображения цены */}
                {tool.startPrice && tool.startPrice > 0 ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3 py-1 rounded-full shadow-lg">
                      <span className="text-xs font-medium text-white">Подписка</span>
                      <span className="ml-1 text-xs font-semibold text-white">{tool.startPrice}$</span>
                      <span className="ml-1 text-xs font-medium text-white">/ {formatPrice(tool.price ?? undefined)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3 py-1 rounded-full shadow-lg">
                    <span className="text-xs font-semibold text-white">{formatPrice(tool.price ?? undefined)}</span>
                  </div>
                )}
                <div className="flex gap-4 mt-4">
                  {tool.price && tool.price > 0 ? (
                    <>
                      <PaymentDialog 
                        priceRub={tool.price ?? null}
                        title="aitools"
                        tool={tool}
                      >
                        <Button className="bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black dark:hover:bg-gray-200 border border-transparent">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Купить
                        </Button>
                      </PaymentDialog>
                      <Button 
                        variant="outline" 
                        className="bg-white border-gray-300 text-black hover:bg-gray-100 dark:bg-gray-200 dark:border-gray-400 dark:text-black dark:hover:bg-gray-300"
                        asChild
                      >
                        <Link href={tool.url || '#'} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Смотреть
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="bg-white border-gray-300 text-black hover:bg-gray-100 dark:bg-gray-200 dark:border-gray-400 dark:text-black dark:hover:bg-gray-300"
                      asChild
                    >
                      <Link href={tool.url || '#'} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Смотреть
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          {toolsToShow.map((tool, index) => (
            <div
              key={tool.id}
              className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                activeTab === index
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-black dark:text-white hover:border-gray-300 dark:hover:border-gray-700"
              }`}
              onClick={() => setActiveTab(index)}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{tool.name}</h3>
                <div className={`flex items-center ${
                  activeTab === index
                    ? "text-white dark:text-black"
                    : "text-black dark:text-white"
                }`}>
                  <Star className="h-4 w-4 mr-1" />
                  <span>{typeof tool.rating === 'number' ? tool.rating.toFixed(1) : 'N/A'}</span>
                </div>
              </div>
              <p className={activeTab === index ? "text-gray-200 dark:text-gray-800" : "text-gray-600 dark:text-gray-400"}>
                {tool.description}
              </p>
              {/* Обновлённый блок отображения цены в табах */}
              <div className="flex justify-end mt-2">
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-2 py-1 rounded-full shadow-lg">
                  <span className="text-sm font-semibold text-white">{formatPrice(tool.price ?? undefined)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center mt-12">
        <Link
          href="/catalog"
          className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-8 py-3 rounded-full font-medium transition-all duration-300"
          prefetch={false}
        >
          Смотреть все
        </Link>
      </div>
        </div>
      </div>
    </section>
  )
}
