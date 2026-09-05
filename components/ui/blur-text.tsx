"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type AnimationSnapshot = Record<string, string | number>;
type BlurTextElement = "div" | "h1" | "h2" | "h3" | "p";

interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: AnimationSnapshot;
  animationTo?: AnimationSnapshot[];
  easing?: Transition["ease"];
  onAnimationComplete?: () => void;
  stepDuration?: number;
  as?: BlurTextElement;
  id?: string;
  style?: CSSProperties;
}

function buildKeyframes(from: AnimationSnapshot, steps: AnimationSnapshot[]) {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))]);
  const keyframes: Record<string, Array<string | number>> = {};

  keys.forEach((key) => {
    const fallback = from[key] ?? steps.find((step) => step[key] !== undefined)?.[key] ?? 0;
    keyframes[key] = [fallback, ...steps.map((step) => step[key] ?? fallback)];
  });

  return keyframes;
}

export default function BlurText({
  text = "",
  delay = 200,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = "easeOut",
  onAnimationComplete,
  stepDuration = 0.35,
  as: Element = "p",
  id,
  style,
}: BlurTextProps) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion, rootMargin, threshold]);

  const defaultFrom = useMemo<AnimationSnapshot>(
    () => ({ filter: "blur(10px)", opacity: 0, y: direction === "top" ? -40 : 40 }),
    [direction],
  );
  const defaultTo = useMemo<AnimationSnapshot[]>(
    () => [
      { filter: "blur(5px)", opacity: 0.5, y: direction === "top" ? 5 : -5 },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, index) =>
    stepCount === 1 ? 0 : index / (stepCount - 1),
  );
  const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
  const shouldAnimate = inView && !reduceMotion;

  return (
    <Element
      id={id}
      ref={ref as React.Ref<never>}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", ...style }}
    >
      {elements.map((segment, index) => (
        <motion.span
          className="inline-block will-change-[transform,filter,opacity]"
          key={`${segment}-${index}`}
          initial={reduceMotion ? false : fromSnapshot}
          animate={reduceMotion ? { filter: "blur(0px)", opacity: 1, y: 0 } : shouldAnimate ? animateKeyframes : fromSnapshot}
          transition={{
            duration: reduceMotion ? 0 : totalDuration,
            times,
            delay: reduceMotion ? 0 : (index * delay) / 1000,
            ease: easing,
          }}
          onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
        >
          {segment === " " ? "\u00A0" : segment}
          {animateBy === "words" && index < elements.length - 1 ? "\u00A0" : null}
        </motion.span>
      ))}
    </Element>
  );
}
