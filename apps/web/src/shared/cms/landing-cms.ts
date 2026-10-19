import type { LandingTranslationOverrides } from "@/shared/i18n";

export interface LandingCmsPayload {
  translations?: LandingTranslationOverrides;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://noghre.land/api/v1";
const LANDING_CMS_TIMEOUT_MS = 1_200;

export async function getLandingCms(): Promise<LandingCmsPayload | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LANDING_CMS_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}/cms/landing`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as LandingCmsPayload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
