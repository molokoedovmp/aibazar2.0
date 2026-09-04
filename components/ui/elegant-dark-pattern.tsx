import type React from "react";

import { cn } from "@/lib/utils";

interface DarkGradientBgProps {
  children?: React.ReactNode;
  className?: string;
}

const streakMasks = [
  "linear-gradient(90deg, transparent 0%, black 20%, transparent 36%, black 55%, rgba(0,0,0,.13) 67%, black 78%, transparent 97%)",
  "linear-gradient(90deg, transparent 11%, black 25%, rgba(0,0,0,.55) 41%, rgba(0,0,0,.13) 67%, black 78%, transparent 97%)",
  "linear-gradient(90deg, transparent 9%, black 20%, rgba(0,0,0,.55) 28%, rgba(0,0,0,.424) 40%, black 48%, rgba(0,0,0,.267) 54%, rgba(0,0,0,.13) 78%, black 88%, transparent 97%)",
  "linear-gradient(90deg, transparent 0%, black 17%, rgba(0,0,0,.55) 26%, black 35%, transparent 47%, rgba(0,0,0,.13) 69%, black 79%, transparent 97%)",
  "linear-gradient(90deg, transparent 0%, black 20%, rgba(0,0,0,.55) 27%, black 42%, transparent 48%, rgba(0,0,0,.13) 67%, black 74%, black 82%, rgba(0,0,0,.47) 88%, transparent 97%)",
];

export function DarkGradientBg({ children, className }: DarkGradientBgProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-black", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(100% 100% at 0% 0%, rgb(46, 46, 46) 0%, rgb(0, 0, 0) 100%)",
            mask: "radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, transparent 100%)",
            WebkitMask:
              "radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, transparent 100%)",
          }}
        >
          {streakMasks.map((mask, index) => (
            <div
              key={mask}
              className="absolute inset-0 opacity-20"
              style={{
                background: "linear-gradient(rgb(0, 207, 255) 0%, transparent 100%)",
                mask,
                WebkitMask: mask,
                transform: `translateX(${index * 1.5 - 3}%) skewX(45deg)`,
              }}
            />
          ))}
        </div>

        <div
          className="absolute inset-0 bg-repeat opacity-5"
          style={{
            backgroundImage:
              'url("https://cdn.21st.dev/assets/mirror/f5/f55dfc553c100e6da0ad95258a042b4100f0ff4bb03a5313d1f541984275e262.png")',
            backgroundSize: "149.76px",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(30,41,59,.2), transparent 58%)",
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
