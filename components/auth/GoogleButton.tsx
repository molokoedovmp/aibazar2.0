"use client";

import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M17.64 9.2045c0-.638-.0573-1.251-.1636-1.836H9v3.472h4.84c-.208.1125-.47.263-.807.4165-1.057 1.8985-3.093 3.19-5.466 3.19A6.3 6.3 0 0 1 1.8 8.9995 6.3 6.3 0 0 1 7.567 2.9995c1.708 0 3.246.6505 4.432 1.711l2.442-2.374C12.784.534 10.82-.0005 8.7-.0005 3.9-.0005 0 3.8995 0 8.9995s3.9 9 8.7 9c4.854 0 8.34-3.4095 8.94-7.795h.001v-.999z" fill="#4285F4"/>
      <path d="M0 0h18v18H0z" fill="none"/>
    </svg>
  );
}

export default function GoogleButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/account" })}
      className={cn(
        "w-full h-10 rounded-md bg-white text-black border border-input transition-colors hover:bg-accent",
        "inline-flex items-center justify-center gap-2 px-3 text-sm font-medium",
        className
      )}
      aria-label="Войти через Google"
    >
      <GoogleIcon />
      Войти через Google
    </button>
  );
}

