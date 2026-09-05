"use client";

import { useEffect, useState } from "react";

import { HomeCatalogSearch } from "./HomeCatalogSearch";
import PopularToolsSection, { type FeaturedResponse } from "./PopularToolsSection";

export function Landingsecond() {
  const [payload, setPayload] = useState<FeaturedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const totalCatalogItems = payload
    ? Object.values(payload.counts).reduce((total, count) => total + count, 0)
    : 0;

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/library/featured", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load featured resources");
        return response.json() as Promise<FeaturedResponse>;
      })
      .then((result) => {
        if (result.success) setPayload(result);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setPayload(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main>
      <meta name="yandex-verification" content="31f9fbf9bddca189" />

      <PopularToolsSection payload={payload} loading={loading}>
        <HomeCatalogSearch totalItems={totalCatalogItems} />
      </PopularToolsSection>
    </main>
  );
}
