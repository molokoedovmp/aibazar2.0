"use client";

import { useState, type CSSProperties } from "react";

type ToolImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackTextClassName?: string;
  style?: CSSProperties;
};

function hashName(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function gradientsForName(name: string) {
  const hash = hashName(name);
  const tealHue = 174 + (hash % 22);
  const blueHue = 205 + ((hash >>> 8) % 25);
  const accentPosition = 18 + ((hash >>> 16) % 56);

  return {
    lightTheme: [
      `radial-gradient(circle at ${accentPosition}% 18%, hsl(${tealHue} 74% 45% / 0.34), transparent 42%)`,
      `radial-gradient(circle at 82% 82%, hsl(${blueHue} 78% 46% / 0.24), transparent 44%)`,
      "linear-gradient(145deg, #14262b 0%, #0b171b 48%, #101820 100%)",
    ].join(", "),
    darkTheme: [
      `radial-gradient(circle at ${accentPosition}% 18%, hsl(${tealHue} 64% 52% / 0.2), transparent 42%)`,
      `radial-gradient(circle at 82% 82%, hsl(${blueHue} 70% 55% / 0.14), transparent 44%)`,
      "linear-gradient(145deg, #f4f8f7 0%, #dce9e9 48%, #edf3f5 100%)",
    ].join(", "),
  };
}

export function ToolImage({
  src,
  alt = "AI-инструмент",
  className = "",
  fallbackTextClassName = "text-xl sm:text-2xl",
  style,
}: ToolImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;
  const fallbackGradients = gradientsForName(alt);

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`relative isolate flex items-center justify-center overflow-hidden bg-[#0b171b] text-center text-white dark:bg-[#e7f0f0] dark:text-slate-950 ${className}`}
        style={style}
      >
        <span aria-hidden="true" className="absolute inset-0 z-0 dark:hidden" style={{ backgroundImage: fallbackGradients.lightTheme }} />
        <span aria-hidden="true" className="absolute inset-0 z-0 hidden dark:block" style={{ backgroundImage: fallbackGradients.darkTheme }} />
        <span
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-25 dark:hidden"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px), radial-gradient(circle at 1px 1px, rgba(255,255,255,.45) 1px, transparent 0)",
            backgroundSize: "28px 28px, 28px 28px, 15px 15px",
            maskImage: "linear-gradient(to bottom, black, rgba(0,0,0,.45))",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 z-0 hidden opacity-30 dark:block"
          style={{
            backgroundImage:
              "linear-gradient(rgba(5,28,32,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(5,28,32,.12) 1px, transparent 1px), radial-gradient(circle at 1px 1px, rgba(5,28,32,.35) 1px, transparent 0)",
            backgroundSize: "28px 28px, 28px 28px, 15px 15px",
            maskImage: "linear-gradient(to bottom, black, rgba(0,0,0,.45))",
          }}
        />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 z-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent dark:from-white/30" />
        <span
          className={`relative z-10 line-clamp-3 max-w-[84%] font-bold leading-tight tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)] dark:drop-shadow-[0_2px_14px_rgba(255,255,255,0.8)] ${fallbackTextClassName}`}
        >
          {alt}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailedSrc(src)}
    />
  );
}
