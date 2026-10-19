import type { Lang } from "@/shared/i18n";

import { PRODUCTS, type Product } from "./products-data";
import { SILVER_PRODUCTS } from "./silver-products-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://noghre.land/api/v1";

type ApiProduct = {
  id: string;
  badge?: Product["badge"];
  category: string;
  categorySlug?: string;
  cover: string;
  currency: string;
  currentVersion?: string;
  databases: string[];
  demoUrl?: string;
  descriptionMarkdown: string;
  features: { items?: string[] };
  framework: string[];
  gallery: string[];
  licenseType: string;
  price: number;
  publishedAt?: string;
  ratingAverage: number;
  reviewCount: number;
  salePrice?: number;
  salesCount: number;
  shortDescription: string;
  slug: string;
  tags: Array<{ slug: string; title: string }>;
  title: string;
  updatedAt: string;
  changelog?: Array<{ date: string; notes: Record<Lang, string>; version: string }>;
  faqs?: Array<{ a?: string | null; q: string }>;
  related?: ApiProduct[];
  silver?: Product["silver"];
  pricing?: Product["pricing"];
};

export type ProductDetail = Product & { related?: Product[] };

export async function getProducts(lang: Lang): Promise<Product[]> {
  let response = await safeFetch<{ items: ApiProduct[] }>(`/products?language=${lang}&pageSize=100`);
  if (!response?.items?.length && lang !== "fa") {
    response = await safeFetch<{ items: ApiProduct[] }>("/products?language=fa&pageSize=100");
  }
  if (!response?.items?.length) return SILVER_PRODUCTS;
  const apiProducts = response.items.map((product) => fromApiProduct(product, lang));
  const apiSilverProducts = apiProducts.filter((product) =>
    Boolean(product.silver?.formFactor || product.silver?.weightGrams) || ["silver-bars", "silver-capsules", "silver-granules"].includes(String(product.category)),
  );
  return apiSilverProducts.map((product) => mergeSilverProduct(product, SILVER_PRODUCTS.find((fallback) => fallback.slug === product.slug)));
}

export async function getProductFromApi(slug: string, lang: Lang): Promise<ProductDetail | null> {
  let response = await safeFetch<ApiProduct>(`/products/${slug}?lang=${lang}`);
  if (!response && lang !== "fa") response = await safeFetch<ApiProduct>(`/products/${slug}?lang=fa`);
  if (!response) return SILVER_PRODUCTS.find((product) => product.slug === slug) ?? PRODUCTS.find((product) => product.slug === slug) ?? null;
  const apiProduct = fromApiProduct(response, lang);
  const fallback = SILVER_PRODUCTS.find((product) => product.slug === slug);
  return {
    ...mergeSilverProduct(apiProduct, fallback),
    related: response.related?.map((item) => {
      const mapped = fromApiProduct(item, lang);
      return mergeSilverProduct(mapped, SILVER_PRODUCTS.find((product) => product.slug === mapped.slug));
    }),
  };
}

function mergeSilverProduct(apiProduct?: Product, fallback?: Product): Product {
  if (!apiProduct) return fallback!;
  if (!fallback) return apiProduct;
  const apiHasImage = isProductImageSource(apiProduct.cover);
  const gallery = apiProduct.gallery.filter(isProductImageSource);
  return {
    ...fallback,
    ...apiProduct,
    cover: apiHasImage ? apiProduct.cover : (gallery[0] ?? ""),
    gallery,
    silver: { ...fallback.silver, ...apiProduct.silver },
  };
}

export function isProductImageSource(value?: string | null) {
  const source = value?.trim();
  if (!source) return false;
  return (
    source.startsWith("/") ||
    source.startsWith("blob:") ||
    source.startsWith("data:image/") ||
    /^https?:\/\//i.test(source) ||
    /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(source)
  );
}

function fromApiProduct(product: ApiProduct, lang: Lang): Product {
  const localized = (value: string) => ({ ar: value, en: value, fa: value });
  return {
    author: { avatar: "ن", level: "", name: "نقره لند", sales: 0 },
    badge: product.badge,
    category: (product.categorySlug ?? product.category) as Product["category"],
    categoryLabel: product.category,
    changelog: product.changelog?.map((item) => ({ date: item.date, notes: item.notes, version: item.version })) ?? [],
    cover: product.cover,
    created: product.publishedAt?.slice(0, 10) ?? "2026-01-01",
    currency: product.currency,
    databases: product.databases,
    description: localized(product.descriptionMarkdown),
    faqs: product.faqs?.map((item) => ({ a: localized(item.a ?? ""), q: localized(item.q) })) ?? [],
    features: (product.features.items ?? []).map((item) => localized(item)),
    framework: product.framework,
    gallery: Array.from(new Set([product.cover, ...product.gallery].filter(Boolean))),
    id: product.id,
    lastUpdate: product.updatedAt.slice(0, 10),
    license: product.licenseType as Product["license"],
    preview: product.demoUrl ?? `/contact?topic=demo&product=${product.slug}`,
    price: product.price,
    pricing: product.pricing,
    rating: product.ratingAverage,
    reviews: product.reviewCount,
    salePrice: product.salePrice,
    silver: product.silver,
    sales: product.salesCount,
    short: localized(product.shortDescription),
    slug: product.slug,
    tags: product.tags.map((tag) => tag.title),
    title: localized(product.title),
    version: product.currentVersion ?? (product.silver?.weightGrams ? `${product.silver.weightGrams}g` : "1.0.0"),
  };
}

async function safeFetch<T>(path: string): Promise<T | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: "no-store", signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
