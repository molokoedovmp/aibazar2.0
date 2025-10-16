"use client";

import { useEffect, useRef, useId } from "react";

type Props = {
  clientId: string;
  redirectUri?: string;
  className?: string;
};

declare global {
  interface Window { YaAuthSuggest?: any; }
}

let yandexSdkPromise: Promise<void> | null = null;
function loadYandexSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YaAuthSuggest) return Promise.resolve();
  if (yandexSdkPromise) return yandexSdkPromise;
  yandexSdkPromise = new Promise<void>((resolve, reject) => {
    const src = "https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js";
    if (document.querySelector(`script[src="${src}"]`)) {
      const check = setInterval(() => {
        if (window.YaAuthSuggest) { clearInterval(check); resolve(); }
      }, 50);
      setTimeout(() => { clearInterval(check); window.YaAuthSuggest ? resolve() : reject(new Error("Ya SDK not loaded")); }, 5000);
      return;
    }
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Yandex SDK"));
    document.body.appendChild(s);
  });
  return yandexSdkPromise;
}

export default function YandexSuggestButton({ clientId, redirectUri, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<null | (() => void)>(null);
  const clickHandlerRef = useRef<((e: Event) => void) | null>(null);
  // useId обеспечивает одинаковое значение на сервере и клиенте — избегаем hydration mismatch
  const reactId = useId();
  const containerId = `ya-auth-btn-${reactId.replace(/:/g, "-")}`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadYandexSdk();
        if (!mounted || !containerRef.current) return;
        // Жёстко очищаем контейнер перед отрисовкой, чтобы исключить дубли
        containerRef.current.innerHTML = "";
        // Убираем старый обработчик на всякий случай
        const el = document.getElementById(containerId);
        if (el && clickHandlerRef.current) el.removeEventListener("click", clickHandlerRef.current);

        const oauthQueryParams = {
          client_id: clientId,
          response_type: "token",
          redirect_uri: redirectUri || window.location.origin,
        } as const;
        const tokenPageOrigin = window.location.origin;

        const { handler, cleanup } = await window.YaAuthSuggest.init(
          oauthQueryParams,
          tokenPageOrigin,
          {
            view: "button",
            parentId: containerId,
            buttonSize: "m",
            buttonView: "main",
            buttonTheme: "light",
            buttonBorderRadius: "12",
            buttonIcon: "ya",
          }
        );
        if (!mounted) { try { cleanup?.(); } catch {} return; }
        cleanupRef.current = cleanup;
        const el2 = document.getElementById(containerId);
        if (el2) {
          const onClick = (e: Event) => { e.preventDefault(); handler(); };
          el2.addEventListener("click", onClick);
          clickHandlerRef.current = onClick;
        }
      } catch (_) {
        // Не показываем самописный фолбэк — по требованию оставляем только официальный виджет
      }
    })();

    return () => {
      mounted = false;
      if (cleanupRef.current) { try { cleanupRef.current(); } catch { /* noop */ } }
      const el = document.getElementById(containerId);
      if (el && clickHandlerRef.current) el.removeEventListener("click", clickHandlerRef.current);
      clickHandlerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [clientId, redirectUri, containerId]);

  return <div id={containerId} ref={containerRef} className={className} suppressHydrationWarning />;
}
