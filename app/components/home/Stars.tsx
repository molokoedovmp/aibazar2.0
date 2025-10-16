"use client";
import { useEffect, useState } from "react";

export default function Stars() {
  const [stars, setStars] = useState<
    { top: string; left: string; delay: string; opacity: number }[]
  >([]);

  useEffect(() => {
    // Генерация звёздочек только на клиенте
    const generated = Array.from({ length: 20 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      opacity: Math.random() * 0.7 + 0.3,
    }));
    setStars(generated);
  }, []);

  return (
    <>
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 bg-white rounded-full animate-pulse"
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
            opacity: star.opacity,
          }}
        />
      ))}
    </>
  );
}
