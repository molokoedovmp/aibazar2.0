"use client";

import Spline from "@splinetool/react-spline";

export default function SplineClient({ scene }: { scene: string }) {
  return <Spline scene={scene} className="w-full h-full" />;
}
