"use client";

import Link from "next/link";

import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">{t("Something went wrong")}</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("Try again")}
          </button>
          <Link
            href="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent/10"
          >
            {t("Home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
