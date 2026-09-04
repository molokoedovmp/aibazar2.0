import type { Metadata } from "next";
import { Geist_Mono, Prosto_One } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/app/components/SessionProvider";

// Force dynamic rendering across the app to avoid
// DB access during static generation at build time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prostoOne = Prosto_One({
  variable: "--font-prosto-one",
  weight: "400",
  subsets: ["cyrillic", "latin"],
  display: "swap",
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
      { url: "/favicon-ptsr.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: ["/favicon.ico"],
    apple: ["/favicon-ptsr.png"],
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
    <html lang="ru" className="overflow-x-hidden" suppressHydrationWarning>
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
        <link rel="icon" type="image/png" href="/favicon-ptsr.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon-ptsr.png" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${prostoOne.variable} ${geistMono.variable} bg-background font-sans text-foreground antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
