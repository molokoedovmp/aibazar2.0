"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type Offset = { x: number; y: number };
type Direction = "right" | "left" | "up" | "down" | "diagonal";

function setHiDPICanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const parent = canvas.parentElement;
  const width = Math.max(1, parent?.clientWidth ?? window.innerWidth);
  const height = Math.max(1, parent?.clientHeight ?? window.innerHeight);
  const dpr = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function originFromOffset(offset: Offset, cell: number) {
  return {
    x: -(((offset.x % cell) + cell) % cell),
    y: -(((offset.y % cell) + cell) % cell),
  };
}

interface GridProps {
  squareSize: number;
  borderColor: string;
  vignette: boolean;
  vignetteColor: string;
  gridOffsetRef: MutableRefObject<Offset>;
}

function MovingGrid({ squareSize, borderColor, vignette, vignetteColor, gridOffsetRef }: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const origin = originFromOffset(gridOffsetRef.current, squareSize);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      for (let x = origin.x; x < width + squareSize; x += squareSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      for (let y = origin.y; y < height + squareSize; y += squareSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }

      if (vignette) {
        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.sqrt(width * width + height * height) / 2,
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, vignetteColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrame.current = requestAnimationFrame(draw);
    };

    const resize = () => setHiDPICanvas(canvas, ctx);
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    resize();
    draw();

    return () => {
      resizeObserver.disconnect();
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [borderColor, gridOffsetRef, squareSize, vignette, vignetteColor]);

  return <canvas ref={canvasRef} className="block h-full w-full border-none" />;
}

interface HoverProps {
  squareSize: number;
  hoverFillColor: string;
  hoverStrokeColor: string;
  hoverGlowColor: string;
  gridOffsetRef: MutableRefObject<Offset>;
}

function SquaresInteractive({
  squareSize,
  hoverFillColor,
  hoverStrokeColor,
  hoverGlowColor,
  gridOffsetRef,
}: HoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      if (hoveredRef.current) {
        const origin = originFromOffset(gridOffsetRef.current, squareSize);
        const cellX = origin.x + hoveredRef.current.x * squareSize;
        const cellY = origin.y + hoveredRef.current.y * squareSize;

        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = hoverGlowColor;
        ctx.fillStyle = hoverFillColor;
        ctx.fillRect(cellX, cellY, squareSize, squareSize);
        ctx.restore();

        ctx.lineWidth = 1.25;
        ctx.strokeStyle = hoverStrokeColor;
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, squareSize - 1, squareSize - 1);

        const sheen = ctx.createLinearGradient(cellX, cellY, cellX, cellY + squareSize);
        sheen.addColorStop(0, "rgba(255,255,255,.16)");
        sheen.addColorStop(1, "rgba(255,255,255,.03)");
        ctx.fillStyle = sheen;
        ctx.fillRect(cellX, cellY, squareSize, squareSize);
      }

      animationFrame.current = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        hoveredRef.current = null;
        return;
      }

      const origin = originFromOffset(gridOffsetRef.current, squareSize);
      hoveredRef.current = {
        x: Math.floor((event.clientX - rect.left - origin.x) / squareSize),
        y: Math.floor((event.clientY - rect.top - origin.y) / squareSize),
      };
    };

    const onPointerLeave = () => {
      hoveredRef.current = null;
    };
    const resize = () => setHiDPICanvas(canvas, ctx);
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    resize();
    draw();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerLeave);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerLeave);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [gridOffsetRef, hoverFillColor, hoverGlowColor, hoverStrokeColor, squareSize]);

  return <canvas ref={canvasRef} className="pointer-events-none block h-full w-full border-none" />;
}

interface NoiseGridBackgroundProps {
  showGrid?: boolean;
  direction?: Direction;
  speed?: number;
  squareSize?: number;
  borderColor?: string;
  vignette?: boolean;
  hoverFillColor?: string;
  hoverStrokeColor?: string;
  hoverGlowColor?: string;
  className?: string;
}

export default function NoiseDarkBlueGradientWithSquares({
  showGrid = true,
  direction = "diagonal",
  speed = 0.22,
  squareSize = 48,
  borderColor,
  vignette = true,
  hoverFillColor,
  hoverStrokeColor,
  hoverGlowColor,
  className,
}: NoiseGridBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridOffsetRef = useRef<Offset>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const activeBorderColor =
    borderColor ?? (isDark ? "rgba(255,255,255,.075)" : "rgba(15,23,42,.11)");
  const activeHoverFill =
    hoverFillColor ?? (isDark ? "rgba(0,207,255,.055)" : "rgba(0,145,190,.07)");
  const activeHoverStroke =
    hoverStrokeColor ?? (isDark ? "rgba(0,207,255,.18)" : "rgba(0,115,160,.22)");
  const activeHoverGlow =
    hoverGlowColor ?? (isDark ? "rgba(0,207,255,.16)" : "rgba(0,145,190,.14)");
  const vignetteColor = isDark ? "rgba(0,0,0,.30)" : "rgba(100,116,139,.12)";

  useEffect(() => {
    const tick = () => {
      const velocity = Math.max(speed, 0.05);
      const size = squareSize;

      if (direction === "right" || direction === "diagonal") {
        gridOffsetRef.current.x = (gridOffsetRef.current.x - velocity + size) % size;
      } else if (direction === "left") {
        gridOffsetRef.current.x = (gridOffsetRef.current.x + velocity + size) % size;
      }

      if (direction === "down" || direction === "diagonal") {
        gridOffsetRef.current.y = (gridOffsetRef.current.y - velocity + size) % size;
      } else if (direction === "up") {
        gridOffsetRef.current.y = (gridOffsetRef.current.y + velocity + size) % size;
      }

      animationFrame.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [direction, speed, squareSize]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#e8edef] dark:bg-[#05080a]",
        className,
      )}
    >
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse 72% 30% at 50% 52%, rgba(0,170,215,.14) 0%, rgba(0,170,215,.045) 48%, transparent 76%), #e8edef",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse 72% 30% at 50% 52%, rgba(0,207,255,.15) 0%, rgba(0,207,255,.055) 48%, transparent 76%), #05080a",
        }}
      />
      {showGrid ? (
        <div className="absolute inset-0">
          <MovingGrid
            squareSize={squareSize}
            borderColor={activeBorderColor}
            vignette={vignette}
            vignetteColor={vignetteColor}
            gridOffsetRef={gridOffsetRef}
          />
        </div>
      ) : null}
      <div className="absolute inset-0">
        <SquaresInteractive
          squareSize={squareSize}
          hoverFillColor={activeHoverFill}
          hoverStrokeColor={activeHoverStroke}
          hoverGlowColor={activeHoverGlow}
          gridOffsetRef={gridOffsetRef}
        />
      </div>
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-multiply dark:opacity-[0.16] dark:mix-blend-soft-light"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'.72\'/%3E%3C/svg%3E")',
          backgroundSize: "180px 180px",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[28rem] dark:hidden"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.28), transparent 100%)" }}
      />
      <div
        className="absolute inset-x-0 top-0 hidden h-[28rem] dark:block"
        style={{ background: "linear-gradient(180deg, rgba(1,3,4,.14), transparent 100%)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-300/35 dark:to-[#05080a]/45" />
    </div>
  );
}
