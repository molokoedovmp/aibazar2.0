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

function gradientForName(name: string): string {
  const hash = hashName(name);
  const firstHue = hash % 360;
  const secondHue = (firstHue + 55 + ((hash >>> 8) % 80)) % 360;
  const thirdHue = (secondHue + 45 + ((hash >>> 16) % 75)) % 360;

  return [
    "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.32), transparent 38%)",
    `linear-gradient(135deg, hsl(${firstHue} 78% 36%), hsl(${secondHue} 76% 44%) 52%, hsl(${thirdHue} 82% 48%))`,
  ].join(", ");
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

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center overflow-hidden text-center text-white ${className}`}
        style={{ ...style, backgroundImage: gradientForName(alt) }}
      >
        <span
          className={`line-clamp-3 max-w-[88%] font-bold leading-tight tracking-tight drop-shadow-lg ${fallbackTextClassName}`}
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
