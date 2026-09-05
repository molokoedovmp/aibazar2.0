import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Как оплатить зарубежные AI-сервисы из России",
  description:
    "Пошаговая инструкция по оплате ChatGPT, Claude, Midjourney и других зарубежных AI-сервисов из России: по ссылке, через аккаунт или с помощью aiBazar.",
  keywords: [
    "как оплатить ChatGPT из России",
    "оплата AI сервисов",
    "оплата зарубежных подписок",
    "как оплатить Claude",
    "как оплатить Midjourney",
    "подписка на нейросеть",
  ],
  alternates: {
    canonical: "/payment-instructions",
  },
  openGraph: {
    type: "article",
    locale: "ru_RU",
    url: "/payment-instructions",
    siteName: "aiBazar",
    title: "Как оплатить зарубежные AI-сервисы из России",
    description:
      "Понятная инструкция по оплате подписок на зарубежные нейросети: доступные способы, порядок действий и меры безопасности.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Как оплатить зарубежные AI-сервисы из России",
    description:
      "Пошаговая инструкция по оплате ChatGPT, Claude, Midjourney и других AI-сервисов.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function PaymentInstructionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
