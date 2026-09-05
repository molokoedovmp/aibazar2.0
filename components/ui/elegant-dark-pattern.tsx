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
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden bg-[#f5f8fa] [--pattern-start:#e2edf1] [--pattern-end:#f5f8fa] [--pattern-streak:rgba(0,155,195,0.45)] [--pattern-dot:rgba(30,60,75,0.35)] [--pattern-highlight:rgba(220,236,243,0.3)] dark:bg-black dark:[--pattern-start:#2e2e2e] dark:[--pattern-end:#000] dark:[--pattern-streak:rgb(0,207,255)] dark:[--pattern-dot:rgba(255,255,255,0.5)] dark:[--pattern-highlight:rgba(30,41,59,0.2)]",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(100% 100% at 0% 0%, var(--pattern-start) 0%, var(--pattern-end) 100%)",
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
                background: "linear-gradient(var(--pattern-streak) 0%, transparent 100%)",
                mask,
                WebkitMask: mask,
                transform: `translateX(${index * 1.5 - 3}%) skewX(45deg)`,
              }}
            />
          ))}
        </div>

        <div
          className="absolute inset-0 bg-repeat opacity-[0.025] mix-blend-multiply dark:opacity-5 dark:mix-blend-normal"
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
              "radial-gradient(circle at 1px 1px, var(--pattern-dot) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, var(--pattern-highlight), transparent 58%)",
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
