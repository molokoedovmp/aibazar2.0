"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
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

      <div className="space-y-1">
        <div className="text-sm text-gray-700">Электронная почта</div>
        <Input value={email} disabled className="bg-gray-50" />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={saving || loading}>{saving ? "Сохранение..." : "Сохранить"}</Button>
        {savedTs && <span className="text-xs text-muted-foreground">Сохранено: {savedTs.toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}


