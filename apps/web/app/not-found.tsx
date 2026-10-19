"use client";

import Link from "next/link";

import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";

export default function NotFound() {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold">404</h1>
        <p className="mt-4 text-muted-foreground">{t("Page not found")}</p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("Home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
