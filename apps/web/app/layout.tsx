import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import "./globals.css";
import { AppProviders } from "@/app/providers/AppProviders";
import { Toaster } from "@/shared/ui/sonner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noghre.land";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "نقره | پلتفرم خرید و فروش نقره",
    template: "%s | نقره",
  },
  description:
    "نقره، پلتفرم فارسی خرید و فروش آنلاین نقره با کیف پول تومان، دارایی نقره، تحویل فیزیکی، قیمت لحظه‌ای و پشتیبانی حرفه‌ای.",
  keywords: [
    "خرید نقره",
    "فروش نقره",
    "شمش نقره",
    "قیمت نقره",
    "سرمایه گذاری نقره",
    "تحویل فیزیکی نقره",
    "کیف پول نقره",
    "نقره",
  ],
  robots: "index,follow,max-image-preview:large,max-snippet:-1",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "1024x1024" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "1024x1024" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    siteName: "نقره",
    title: "نقره | خرید و فروش امن نقره",
    description:
      "معامله آنلاین نقره با قیمت لحظه‌ای، کیف پول تومان و نقره، تحویل فیزیکی و گواهی اصالت.",
    type: "website",
    locale: "fa_IR",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "نقره | پلتفرم سرمایه‌گذاری نقره",
    description:
      "خرید و فروش امن نقره با قیمت لحظه‌ای، تحویل فیزیکی و پشتیبانی فارسی.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="light" suppressHydrationWarning>
      <body>
        <Script id="theme-language-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');var l=localStorage.getItem('lang')||'fa';var dir=localStorage.getItem('langDir')||'rtl';var d=document.documentElement;var dark=t==='dark';d.classList.toggle('dark',dark);d.classList.toggle('light',!dark);d.lang=l;d.dir=dir==='ltr'?'ltr':'rtl';}catch(e){}})();`}
        </Script>
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
