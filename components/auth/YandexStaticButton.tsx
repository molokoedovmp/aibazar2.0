"use client";

import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  className?: string;
  callbackUrl?: string;
  label?: string;
};

export default function YandexStaticButton({ className, callbackUrl = "/account", label = "Войти с Яндекс ID" }: Props) {
  return (
    <button
      type="button"
      onClick={() => signIn("yandex", { callbackUrl })}
      className={cn(
        "w-full h-12 rounded-2xl bg-black text-white transition-colors hover:bg-black/90",
        "flex items-center justify-start gap-3 px-4",
        className
      )}
      aria-label={label}
    >
      <span className="flex-none">
        <Image src="/Yandex_icon.svg.png" width={24} height={24} alt="Яндекс" priority />
      </span>
      <span className="flex-1 text-center text-[14px] leading-[1] font-medium">
        {label}
      </span>
      {/* Правый невидимый спейсер, чтобы текст был идеально по центру */}
      <span className="flex-none w-6 h-6" aria-hidden />
    </button>
  );
}
