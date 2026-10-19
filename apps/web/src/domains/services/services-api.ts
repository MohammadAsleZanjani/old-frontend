import { Code2 } from "lucide-react";

import type { Lang } from "@/shared/i18n";

import { getService, SERVICES, type Service } from "./data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

type ApiCmsService = {
  description?: Record<Lang, string> | string | null;
  featured?: boolean;
  seo?: { imageUrl?: string } | null;
  short?: Record<Lang, string> | string | null;
  slug: string;
  sortOrder?: number;
  title?: Record<Lang, string> | string | null;
};

type LandingCmsResponse = {
  services?: ApiCmsService[];
};

const fallbackAliases: Record<string, string> = {
  ai: "artificial-intelligence",
  "android-apps": "mobile-apps",
  blockchain: "crypto-exchange-script",
  "cms-scripts": "web-design",
  "custom-software": "web-design",
  "content-production": "seo",
  "crypto-exchange-website": "crypto-exchange-script",
  "custom-blockchain": "crypto-exchange-script",
  "custom-token-development": "crypto-exchange-script",
  "dedicated-hosting": "web-design",
  "digital-marketing": "digital-marketing",
  "erp-crm": "crm-erp",
  "graphic-design": "digital-marketing",
  "ios-apps": "mobile-apps",
  "seo-marketing": "seo",
  "server-infrastructure": "web-design",
  "startup-consulting": "digital-marketing",
  "telegram-game-development": "crypto-exchange-script",
  "telegram-mini-app": "crypto-exchange-script",
};

export async function getServices(lang: Lang): Promise<Service[]> {
  const response = await safeFetch<LandingCmsResponse>(`/cms/landing?language=${lang}`);
  if (!response?.services?.length) return SERVICES;
  return response.services.map((service, index) => fromApiService(service, index)).sort((a, b) => serviceOrder(a.slug) - serviceOrder(b.slug));
}

export async function getServiceFromApi(slug: string, lang: Lang): Promise<Service | null> {
  const services = await getServices(lang);
  return services.find((service) => service.slug === slug) ?? getService(slug) ?? null;
}

function fromApiService(service: ApiCmsService, index: number): Service {
  const fallback = getService(fallbackAliases[service.slug] ?? service.slug) ?? SERVICES[index] ?? SERVICES[0];
  if (!fallback) {
    return {
      cover: "from-amber-500/30 via-yellow-500/20 to-orange-500/30",
      deliverables: localizedArray([]),
      description: localizedText(readLocalized(service.description) ?? readLocalized(service.short) ?? ""),
      faqs: [],
      features: localizedArray([]),
      icon: Code2,
      process: { ar: [], en: [], fa: [] },
      short: localizedText(readLocalized(service.short) ?? ""),
      slug: service.slug,
      technologies: [],
      title: localizedText(readLocalized(service.title) ?? service.slug),
    };
  }

  return {
    ...fallback,
    cover: service.seo?.imageUrl || fallback.cover,
    description: mergeLocalized(fallback.description, service.description ?? service.short),
    short: mergeLocalized(fallback.short, service.short),
    slug: service.slug,
    title: mergeLocalized(fallback.title, service.title),
  };
}

function mergeLocalized(fallback: Record<Lang, string>, value?: Record<Lang, string> | string | null) {
  if (!value) return fallback;
  if (typeof value === "string") return localizedText(value);
  return {
    ar: value.ar || fallback.ar,
    en: value.en || fallback.en,
    fa: value.fa || fallback.fa,
  };
}

function localizedText(value: string): Record<Lang, string> {
  return { ar: value, en: value, fa: value };
}

function localizedArray(value: string[]): Record<Lang, string[]> {
  return { ar: value, en: value, fa: value };
}

function readLocalized(value?: Record<Lang, string> | string | null) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.fa || value.en || value.ar;
}

function serviceOrder(slug: string) {
  const index = [
    "ai",
    "custom-software",
    "web-design",
    "android-apps",
    "ios-apps",
    "erp-crm",
    "blockchain",
    "server-infrastructure",
    "dedicated-hosting",
    "seo-marketing",
    "cms-scripts",
    "startup-consulting",
    "digital-marketing",
    "content-production",
    "custom-token-development",
    "telegram-mini-app",
    "telegram-game-development",
    "graphic-design",
    "custom-blockchain",
    "crypto-exchange-website",
  ].indexOf(slug);
  return index === -1 ? 999 : index;
}

async function safeFetch<T>(path: string): Promise<T | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 }, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
