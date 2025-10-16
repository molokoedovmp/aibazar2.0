"use client";

import { useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User as UserIcon } from "lucide-react";

type Props = {
  className?: string;
  callbackUrl?: string;
};

export default function YandexIdButton({ className, callbackUrl = "/account" }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const label = useMemo(() => {
    const name = session?.user?.name?.trim();
    if (name && name.length > 0) {
      const first = name.split(/\s+/)[0];
      return `Войти как ${first}`;
    }
    return "Войти с Яндекс ID";
  }, [session?.user?.name]);

  const onClick = () => {
    if (session) router.push(callbackUrl);
    else signIn("yandex", { callbackUrl });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "w-full h-12 rounded-2xl bg-black text-white shadow-sm hover:bg-black/90 transition-colors",
        "flex items-center justify-between px-3 gap-3",
        className
      )}
    >
      <span className="flex-none inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FF0000] font-bold">Я</span>
      <span className="flex-1 text-center text-base font-medium whitespace-nowrap">{label}</span>
      <span className="flex-none">
        <Avatar className="h-8 w-8 ring-1 ring-white/20">
          {session?.user?.image ? (
            <AvatarImage src={session.user.image} alt={session.user.name || "user"} />
          ) : (
            <AvatarFallback className="bg-gray-600 text-white">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </span>
    </button>
  );
}
