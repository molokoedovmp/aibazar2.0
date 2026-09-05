import type { Metadata } from "next";
import { Geist_Mono, Prosto_One } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/app/components/SessionProvider";
import { DarkGradientBg } from "@/components/ui/elegant-dark-pattern";

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
  metadataBase: new URL("https://ai-bazar.ru"),
  applicationName: "aiBazar",
  title: {
    default: "Каталог нейросетей и AI-инструментов | aiBazar",
    template: "%s | aiBazar",
  },
  description:
    "Большая библиотека нейросетей и AI-инструментов: MCP-серверы, промпты, навыки и open-source проекты. Найдите решение под свою задачу по описанию и рейтингу.",
  keywords: [
    "каталог нейросетей",
    "библиотека AI-инструментов",
    "найти AI-инструмент",
    "MCP-серверы",
    "промпты для нейросетей",
    "навыки AI-агентов",
    "open-source AI",
  ],
  icons: {
    icon: [
      { url: "/favicon-ptsr.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: ["/favicon.ico"],
    apple: ["/favicon-ptsr.png"],
  },
  openGraph: {
    title: "Каталог нейросетей и AI-инструментов | aiBazar",
    description:
      "Большая AI-библиотека: нейросети, MCP-серверы, промпты, навыки и open-source проекты для разных задач.",
    url: "/",
    siteName: "aiBazar",
    images: [
      { url: "/og-image.jpg", width: 1200, height: 630, alt: "Каталог нейросетей и AI-инструментов aiBazar" },
    ],
    locale: "ru_RU",
    type: "website",
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Каталог нейросетей и AI-инструментов | aiBazar",
    description: "Найдите нейросеть, MCP-сервер, промпт, навык или AI-проект под свою задачу.",
    images: ["/og-image.jpg"],
  },
  alternates: { canonical: "/" },
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
              "description": "Большая библиотека нейросетей, AI-инструментов, MCP-серверов, промптов, навыков и open-source проектов для поиска решений под конкретные задачи.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://ai-bazar.ru/catalog?q={search_term_string}",
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
        className={`${prostoOne.variable} ${geistMono.variable} bg-transparent font-sans text-foreground antialiased`}
      >
        <SessionProvider>
          <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
            <DarkGradientBg className="h-full min-h-0" />
          </div>
          <div className="global-page-layer relative z-10 min-h-screen">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
