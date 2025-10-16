"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Clock, User, Eye, ArrowRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

type DocItem = {
  id: string;
  title: string;
  content?: string | null;
  previewText?: string | null;
  coverImage?: string | null;
  readTime?: number | null;
  views?: number | null;
  userId?: string | null;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
  averageRating?: number | null;
};

function extractPreviewWords(text: string, maxWords = 30) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const words = normalized.split(" ");
  if (words.length <= maxWords) return normalized;
  return words.slice(0, maxWords).join(" ") + "…";
}

function getPreviewText(content?: string) {
  if (!content) return "";
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      const paragraphs = blocks
        .filter((b: any) => b?.type === "paragraph")
        .map((b: any) => b?.props?.text || b?.content?.[0]?.text)
        .filter((t: any) => typeof t === "string" && t.trim().length > 0);
      const combined = paragraphs.join(" ");
      return extractPreviewWords(combined || String(content));
    }
  } catch {
    // not JSON → treat as plain text
  }
  return extractPreviewWords(String(content));
}

function pluralizeMinutes(minutes?: number | null) {
  if (typeof minutes !== "number" || isNaN(minutes)) return "";
  const last = minutes % 10;
  const last2 = minutes % 100;
  if (last2 >= 11 && last2 <= 14) return `${minutes} минут`;
  if (last === 1) return `${minutes} минута`;
  if (last >= 2 && last <= 4) return `${minutes} минуты`;
  return `${minutes} минут`;
}

function formatDateISO(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

export default function CommunityBlog() {
  const [search, setSearch] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState(2);
  const perPage = columns * 3;
  const [sort, setSort] = useState("date_desc");
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocItem[]>([]);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumns(4);
      else if (width >= 768) setColumns(3);
      else setColumns(2);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/blog/summary")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!active) return;
        const mapped: DocItem[] = (data || []).map((d) => ({
          ...d,
          createdAt: d.createdAt ?? d.updatedAt,
          updatedAt: d.updatedAt,
          authorName: d.authorName ?? (d.userId ? String(d.userId).slice(0, 8) : null),
        }));
        setDocs(mapped);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const documentsWithRatings = useMemo(() => {
    return (docs || []).map((doc) => ({
      ...doc,
      previewText: doc.previewText || (doc.content ? getPreviewText(doc.content) : ""),
    }));
  }, [docs]);

  // Самая просматриваемая статья для hero (закреплённая)
  const featured: DocItem | null = useMemo(() => {
    if (!documentsWithRatings.length) return null;
    return documentsWithRatings.reduce((best, d) => {
      const bestViews = Number(best?.views || 0);
      const dViews = Number(d.views || 0);
      return dViews > bestViews ? d : best;
    }, documentsWithRatings[0]);
  }, [documentsWithRatings]);

  const filtered = documentsWithRatings.filter((doc) =>
    (doc.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "date_desc":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "date_asc":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "rating_desc":
        return (b.averageRating || 0) - (a.averageRating || 0);
      case "rating_asc":
        return (a.averageRating || 0) - (b.averageRating || 0);
      case "views_desc":
        return (b.views || 0) - (a.views || 0);
      case "views_asc":
        return (a.views || 0) - (b.views || 0);
      default:
        return 0;
    }
  });

  // Popular and Latest sections
  const popular = useMemo(() => {
    return [...documentsWithRatings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 8);
  }, [documentsWithRatings]);

  const latestFixed = useMemo(() => {
    return [...documentsWithRatings]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);
  }, [documentsWithRatings]);

  const pageCount = Math.ceil(sorted.length / perPage) || 1;
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="min-h-screen bg-white">
      <Navbar/>
      {/* Hero + Featured Article Section (fullscreen) */}
      <section className="bg-black text-white h-[100dvh] md:h-[calc(100dvh-64px)] relative overflow-hidden">
        <div className="absolute inset-0 hidden sm:block">
          <div className="absolute top-20 left-10 w-32 h-32 border-2 border-white/10 rotate-45 animate-pulse" />
          <div className="absolute top-40 right-20 w-24 h-24 border border-white/20 rotate-12 animate-bounce" />
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-white/5 rotate-45 animate-pulse" />
          <div className="absolute bottom-40 right-40 w-20 h-20 border-2 border-white/15 -rotate-12 animate-bounce" />
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-20 grid-rows-20 w-full h-full">
              {Array.from({ length: 400 }, (_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-[1cm] relative z-10 h-full">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 items-center content-center h-full">
            <div className="text-left md:col-span-2 mb-4 md:mb-0 pl-6 sm:pl-0">
              <h1 className="text-3xl sm:text-5xl md:text-5xl font-black mb-3 md:mb-4 tracking-tighter leading-none">
                <span className="block">ОТКРОЙ ДЛЯ СЕБЯ</span>
                <span className="block">МИР AI</span>
                <span className="block">И СОВРЕМЕННЫХ ТЕХНОЛОГИЙ</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl mb-4 md:mb-6 max-w-2xl md:max-w-4xl opacity-90 leading-relaxed">
                Исследуйте мир искусственного интеллекта через экспертные статьи,
                <br />
                <span className="text-lg opacity-70">гайды и практические советы от профессионалов</span>
              </p>
            </div>
            {/* Featured Article (прикреплённая по просмотрам) */}
            {featured && (
              <div className="md:col-span-3 w-full flex justify-center px-2 sm:px-0">
                <Card className="bg-white text-black rounded-2xl shadow-xl overflow-hidden border border-white/10 w-full max-w-3xl">
                  <CardContent className="p-0 h-full">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-1/2 aspect-[16/9] md:aspect-[16/9] overflow-hidden bg-gray-100">
                        {featured.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={featured.coverImage!} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">IMG</div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 flex flex-col h-full justify-between">
                        <div className="flex flex-col gap-4 flex-grow">
                          <div className="flex items-center gap-4">
                            <span className="bg-black text-white px-3 py-1 rounded-lg text-base font-bold">
                              {(featured?.averageRating ?? 0).toFixed(1)}
                            </span>
                            <span className="text-gray-500 text-base">РЕКОМЕНДУЕМОЕ</span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black text-black leading-tight">
                            {featured.title}
                          </h3>
                          <p className="text-gray-600 text-base sm:text-lg leading-relaxed line-clamp-3">
                            {featured.previewText || getPreviewText(featured.content || "")}
                          </p>
                          <div className="flex flex-wrap gap-4 text-gray-500 text-sm sm:text-base">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{featured.authorName || "Автор"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{pluralizeMinutes(featured.readTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{featured.views || "—"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex items-end">
                          <Link href={`/blog/${featured.id}`} className="w-full">
                            <Button className="w-full bg-black text-white hover:bg-gray-800 font-semibold rounded-lg h-11 flex items-center gap-2 justify-center">
                              Читать статью
                              <ArrowRight className="w-5 h-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Popular (blog28 layout) */}
      

      {/* Articles Grid */}
      <section className="py-10 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-[1cm]">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-black mb-3 sm:mb-4 tracking-tight">
              {search ? `РЕЗУЛЬТАТЫ ПОИСКА` : "ВСЕ СТАТЬИ"}
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-black mx-auto" />
            {search && (
              <p className="text-gray-600 mt-4">
                Найдено {filtered.length} статей по запросу "{search}"
              </p>
            )}
            {/* Поиск и фильтры */}
            <div className="max-w-2xl mx-auto mt-6 sm:mt-8 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-center">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Поиск статей, тем, авторов..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-6 py-5 text-lg border-2 border-black rounded-xl focus:ring-4 focus:ring-black/20 bg-white"
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full md:w-64 py-5 text-lg border-2 border-black rounded-xl bg-white">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Сначала новые</SelectItem>
                  <SelectItem value="date_asc">Сначала старые</SelectItem>
                  <SelectItem value="rating_desc">По рейтингу (сначала высокий)</SelectItem>
                  <SelectItem value="rating_asc">По рейтингу (сначала низкий)</SelectItem>
                  <SelectItem value="views_desc">По просмотрам (сначала много)</SelectItem>
                  <SelectItem value="views_asc">По просмотрам (сначала мало)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8 items-stretch">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-2 border-black bg-white animate-pulse">
                    <CardContent className="p-0">
                      <Skeleton className="bg-gray-200 h-40 sm:h-48 w-full border-b-2 border-black" />
                      <div className="p-4 sm:p-6">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-6 w-2/3 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-2" />
                        <div className="flex gap-2 mb-3">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-10" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : paginated.map((doc) => (
                  <Link key={doc.id} href={`/blog/${doc.id}`} className="h-full">
                    <Card className="h-full flex flex-col border-2 border-black rounded-xl hover:shadow-xl transition-all duration-300 transform md:hover:scale-105 bg-white group">
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="bg-gray-100 h-40 sm:h-44 flex items-center justify-center border-b-2 border-black">
                          {doc.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={doc.coverImage} alt="cover" className="object-cover w-full h-full" />
                          ) : (
                            <div className="text-5xl sm:text-6xl font-black text-gray-300 opacity-50">IMG</div>
                          )}
                        </div>
                        <div className="p-4 sm:p-5 flex flex-col grow">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-gray-400 text-xs">
                              {new Date(doc.updatedAt).toLocaleDateString("ru-RU")}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-black mb-1 leading-tight group-hover:text-gray-700 transition-colors line-clamp-2 break-words">
                            {doc.title}
                          </h3>
                          <p className="text-gray-600 text-[11px] sm:text-sm mb-2 sm:mb-3 leading-relaxed line-clamp-3">
                            {doc.previewText || getPreviewText(doc.content || "")}
                          </p>
                          <div className="flex flex-wrap items-center justify-between text-gray-500 text-xs mb-3 sm:mb-4 gap-y-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{doc.userId ? doc.userId.slice(0, 8) : "Автор"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{pluralizeMinutes(doc.readTime)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{doc.views || "—"}</span>
                            </div>
                          </div>
                          <Button className="mt-auto w-full bg-black text-white hover:bg-gray-800 font-bold py-2 sm:py-2.5 rounded-lg text-xs sm:text-base transition-all duration-300 transform md:group-hover:scale-105">
                            ЧИТАТЬ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>

          {/* Пагинация */}
          {pageCount > 1 && (
            <div className="flex justify-center mt-16 sm:mt-20 overflow-x-auto whitespace-nowrap px-2">
              <div className="min-w-max mx-auto">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: pageCount }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        className={page === pageCount ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-16 md:py-20 bg-black text-white">
        <div className="container mx-auto px-[2cm] text-center">
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-black mb-6 sm:mb-8 tracking-tight">ЕСТЬ ЧЕМ ПОДЕЛИТЬСЯ?</h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto opacity-90">
            Опубликуйте свою статью и поделитесь знаниями с сообществом
          </p>
          <Button
            className="bg-white text-black hover:bg-gray-200 text-base sm:text-lg px-6 sm:px-12 py-4 sm:py-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
            onClick={() => setShowGuide(true)}
          >
            НАПИСАТЬ СТАТЬЮ
          </Button>
          <Dialog open={showGuide} onOpenChange={setShowGuide}>
            <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Как создать пост в сообществе?</DialogTitle>
              </DialogHeader>
              <div className="space-y-8 py-4">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative w-full md:w-1/2 aspect-video rounded-lg overflow-hidden">
                    <Image src="/comm2.png" alt="Авторизация" fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-4">1. Подготовка</h3>
                    <div className="space-y-3 text-muted-foreground dark:text-gray-400">
                      <p>• Авторизуйтесь в своем аккаунте</p>
                      <p>• Перейдите в личный кабинет</p>
                      <p>• Найдите кнопку "Создать страницу"</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative w-full md:w-1/2 aspect-video rounded-lg overflow-hidden">
                    <Image src="/comm1.png" alt="Создание поста" fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-4">2. Создание контента</h3>
                    <div className="space-y-3 text-muted-foreground dark:text-gray-400">
                      <p>• Используйте редактор для форматирования текста</p>
                      <p>• Добавляйте изображения и видео</p>
                      <p>• Проверьте пост перед публикацией</p>
                      <p>• Нажмите "Опубликовать"</p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
      <Footer/>
    </div>
  );
}
