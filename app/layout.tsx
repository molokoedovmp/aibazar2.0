import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/app/components/SessionProvider";

// Force dynamic rendering across the app to avoid
// DB access during static generation at build time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aiBazar",
  description:
    "aiBazar - это сервис, который предоставляет доступ к различным AI-инструментам и сервисам.",
  icons: {
    icon: [
      { media: "(prefers-color-scheme: light)", url: "/logo-main.ico", href: "/logo-main.ico" },
      { media: "(prefers-color-scheme: dark)", url: "/logo-main.ico", href: "/logo-main.ico" },
    ],
  },
  openGraph: {
    title: "aiBazar",
    description:
      "aiBazar - это сервис, который предоставляет доступ к различным AI-инструментам и сервисам.",
    url: "https://ai-bazar.ru",
    siteName: "aiBazar",
    images: [
      { url: "https://ai-bazar.ru/og-image.jpg", width: 1200, height: 630, alt: "aiBazar Preview" },
    ],
    locale: "ru_RU",
    type: "website",
  },
  
  alternates: { canonical: "https://ai-bazar.ru" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "HF0qat6HUMU9JgjhU408NBRBYEiZKuX-wSm91x24W0g",
    yandex: "31f9fbf9bddca189",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* JSON-LD: WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://ai-bazar.ru/",
              "name": "aiBazar",
              "description": "aiBazar - это сервис, который предоставляет доступ к различным AI-инструментам и сервисам.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://ai-bazar.ru/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }`,
          }}
        />

        {/* Yandex.Metrika */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(100407501, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
            `,
          }}
        />
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/100407501" style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>


        {/* Favicons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
