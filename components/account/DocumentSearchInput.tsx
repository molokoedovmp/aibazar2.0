"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentSearchInputProps {
  className?: string;
  placeholder?: string;
}

export default function DocumentSearchInput({ className, placeholder }: DocumentSearchInputProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  const debouncedValue = useDebounce(value, 400);

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (current !== value) setValue(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set("q", debouncedValue);
    } else {
      params.delete("q");
    }
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      const query = next ? `?${next}` : "";
      router.replace(`${pathname}${query}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? "Поиск"}
        className="h-11 rounded-full border-gray-200 bg-white pl-10 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-gray-200"
      />
    </div>
  );
}

function useDebounce<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
