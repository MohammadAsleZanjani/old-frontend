"use client";

import type { ReactNode } from "react";

import { I18nProvider, type LandingTranslationOverrides } from "@/shared/i18n";

export function LandingCmsProvider({
  children,
  translations: _translations,
}: {
  children: ReactNode;
  translations?: LandingTranslationOverrides;
}) {
  return <I18nProvider>{children}</I18nProvider>;
}
