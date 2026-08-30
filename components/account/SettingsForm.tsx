"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEdgeStore } from "@/lib/edgestore";

type Props = {
  initialName: string;
  initialImage?: string | null;
  email: string;
};

export default function SettingsForm({ initialName, initialImage, email }: Props) {
  const { update: updateSession } = useSession();
  const { edgestore } = useEdgeStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // Основные данные
  const [name, setName] = useState(initialName || "");
  const [image, setImage] = useState(initialImage || "");

  // Доп. сведения
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [language, setLanguage] = useState("ru");
  const [theme, setTheme] = useState("system");

  // Приватность и уведомления
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [newsEmails, setNewsEmails] = useState(false);
  const [productEmails, setProductEmails] = useState(false);
  const [securityEmails, setSecurityEmails] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedTs, setSavedTs] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageError, setImageError] = useState("");

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      setImageError("Выберите изображение в формате JPG, PNG или WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Размер изображения не должен превышать 5 МБ.");
      return;
    }

    setUploadingImage(true);
    setImageProgress(0);
    setImageError("");

    try {
      const replaceTargetUrl = image.includes("files.edgestore.dev")
        ? image
        : undefined;
      const uploaded = await edgestore.profileImages.upload({
        file,
        onProgressChange: setImageProgress,
        options: replaceTargetUrl ? { replaceTargetUrl } : undefined,
      });

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploaded.url }),
      });
      if (!response.ok) throw new Error("Не удалось сохранить аватар");

      setImage(uploaded.url);
      await updateSession({ image: uploaded.url, name });
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: { image: uploaded.url, name },
        }),
      );
    } catch (error) {
      console.error(error);
      setImageError("Не удалось загрузить изображение. Попробуйте ещё раз.");
    } finally {
      setUploadingImage(false);
      setImageProgress(0);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  useEffect(() => {
    let active = true;
    // Подгружаем текущие настройки из БД
    fetch("/api/account/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((data) => {
        if (!active || !data) return;
        setName((prev) => data.name ?? prev);
        setImage(data.image ?? "");
        const s = data.settings || {};
        setBio(s.bio ?? "");
        setCompany(s.company ?? "");
        setPosition(s.position ?? "");
        setWebsite(s.website ?? "");
        setLocation(s.location ?? "");
        setTimezone(s.timezone ?? "Europe/Moscow");
        setLanguage(s.language ?? "ru");
        setTheme(s.theme ?? "system");
        setAnalyticsEnabled(s.analyticsEnabled ?? true);
        setPublicProfile(s.publicProfile ?? true);
        setNewsEmails(s.newsEmails ?? false);
        setProductEmails(s.productEmails ?? false);
        setSecurityEmails(s.securityEmails ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          image,
          bio,
          company,
          position,
          website,
          location,
          timezone,
          language,
          theme,
          analyticsEnabled,
          publicProfile,
          newsEmails,
          productEmails,
          securityEmails,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await updateSession({ name, image });
      window.dispatchEvent(
        new CustomEvent("profile-updated", { detail: { image, name } }),
      );
      setSavedTs(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const fallback = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Профиль */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border border-gray-200">
          <AvatarImage src={image || undefined} alt={name || email} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1 grid min-w-0 grid-cols-1 gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ImageUp className="h-4 w-4" />
              )}
              {uploadingImage
                ? `Загрузка ${Math.round(imageProgress)}%`
                : "Загрузить фото"}
            </Button>
            <span className="text-xs text-gray-500">JPG, PNG или WebP до 5 МБ</span>
          </div>
          {imageError ? (
            <p className="text-xs text-red-600" role="alert">{imageError}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Электронная почта</div>
          <Input value={email} disabled className="bg-gray-50" />
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Город/Страна</div>
          <Input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Например: Москва, Россия" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm text-gray-700">О себе</div>
        <Textarea value={bio} onChange={(e)=>setBio(e.target.value)} placeholder="Кратко расскажите о себе" rows={4} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Компания</div>
          <Input value={company} onChange={(e)=>setCompany(e.target.value)} placeholder="Где вы работаете" />
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Должность</div>
          <Input value={position} onChange={(e)=>setPosition(e.target.value)} placeholder="Ваша роль" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Сайт</div>
          <Input value={website} onChange={(e)=>setWebsite(e.target.value)} placeholder="https://…" />
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Часовой пояс</div>
          <Input value={timezone} onChange={(e)=>setTimezone(e.target.value)} placeholder="Europe/Moscow" />
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Язык интерфейса</div>
          <Input value={language} onChange={(e)=>setLanguage(e.target.value)} placeholder="ru" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Тема</div>
          <Input value={theme} onChange={(e)=>setTheme(e.target.value)} placeholder="system | light | dark" />
        </div>
      </div>

      {/* Уведомления */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Уведомления по email</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={newsEmails} onChange={(e)=>setNewsEmails(e.target.checked)} />
          Новости и подборки
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={productEmails} onChange={(e)=>setProductEmails(e.target.checked)} />
          Обновления продукта
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={securityEmails} onChange={(e)=>setSecurityEmails(e.target.checked)} />
          Безопасность и вход в аккаунт
        </label>
      </div>

      {/* Конфиденциальность и аналитика */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Конфиденциальность и аналитика</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={publicProfile} onChange={(e)=>setPublicProfile(e.target.checked)} />
          Публичный профиль
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" checked={analyticsEnabled} onChange={(e)=>setAnalyticsEnabled(e.target.checked)} />
          Разрешить анонимную аналитику использования
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={saving || loading}>{saving ? "Сохранение..." : "Сохранить"}</Button>
        {savedTs && <span className="text-xs text-muted-foreground">Сохранено: {savedTs.toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}


