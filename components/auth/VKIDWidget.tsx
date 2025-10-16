"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    VKIDSDK?: any;
  }
}

type Props = {
  className?: string;
  appId?: number;
  redirectUrl?: string;
  scope?: string;
  oauthList?: string[];
};

let vkidSdkPromise: Promise<void> | null = null;
function loadVkidSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.VKIDSDK) return Promise.resolve();
  if (vkidSdkPromise) return vkidSdkPromise;
  vkidSdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    // Версия из вашего примера: <3.0.0
    s.src = "https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load VKID SDK"));
    document.body.appendChild(s);
  });
  return vkidSdkPromise;
}
// , "ok_ru", "mail_ru"
export default function VKIDWidget({ className, appId = 54143148, redirectUrl, scope = "", oauthList = ["vkid"] }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadVkidSdk();
        if (!mounted || !containerRef.current) return;
        const VKID = window.VKIDSDK;
        const url = redirectUrl || (typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback/vk` : "");

        VKID.Config.init({
          app: appId,
          redirectUrl: url,
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope,
        });

        const oAuth = new VKID.OAuthList();
        const widget = oAuth
          .render({
            container: containerRef.current,
            oauthList,
          })
          .on(VKID.WidgetEvents.ERROR, (err: any) => {
            // eslint-disable-next-line no-console
            console.error("VKID error", err);
          })
          .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, (payload: any) => {
            const { code, device_id } = payload;
            VKID.Auth.exchangeCode(code, device_id)
              .then((data: any) => {
                // eslint-disable-next-line no-console
                console.log("VKID success", data);
              })
              .catch((error: any) => {
                // eslint-disable-next-line no-console
                console.error("VKID exchange error", error);
              });
          });

        return () => {
          try { widget?.destroy?.(); } catch {}
        };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [appId, redirectUrl, scope, oauthList]);

  return <div ref={containerRef} className={cn("w-full", className)} />;
}
