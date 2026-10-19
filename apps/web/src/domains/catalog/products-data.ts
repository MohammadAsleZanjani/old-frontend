import type { Lang } from "@/shared/i18n";
import { formatTomanMoney } from "@/shared/lib/toman-money";

export type Localized = Record<Lang, string>;
export type ProductCategory = "silver-bars" | "silver-capsules" | "silver-granules";

export type Product = {
  id?: string;
  slug: string;
  category: ProductCategory;
  categoryLabel?: string;
  tags: string[];
  price: number;
  salePrice?: number;
  currency: string;
  rating: number;
  reviews: number;
  sales: number;
  lastUpdate: string;
  created: string;
  version: string;
  license: "Regular" | "Extended";
  framework: string[];
  databases: string[];
  cover: string;
  preview: string;
  badge?: "Top Seller" | "Trending" | "New" | "Power Elite";
  author: { name: string; level: string; avatar: string; sales: number };
  title: Localized;
  short: Localized;
  description: Localized;
  features: Localized[];
  gallery: string[];
  changelog: { version: string; date: string; notes: Localized }[];
  faqs: { q: Localized; a: Localized }[];
  silver?: {
    certificateType?: string | null;
    countryOfOrigin?: string | null;
    dimensions?: string | null;
    formFactor?: string | null;
    manufacturer?: string | null;
    packaging?: string | null;
    purity?: number | null;
    productFeePercent?: number;
    insurancePercent?: number;
    makingFeeToman?: number;
    sku?: string | null;
    stockQuantity?: number;
    weightGrams?: number | null;
  };
  pricing?: {
    basePricePerGram: number;
    buyPricePerGram: number;
    productFeeAmount: number;
    productFeePercent: number;
    insuranceAmount: number;
    insurancePercent: number;
    makingFeeToman: number;
    silverFeeAmount: number;
    silverFeePercent: number;
    total: number;
    weightGrams: number;
  };
};

type SilverSeed = {
  badge?: Product["badge"];
  category: ProductCategory;
  dimensions: string;
  price: number;
  sku: string;
  slug: string;
  stock: number;
  title: string;
  weight: number;
};

const author = { name: "نقره لند", level: "", avatar: "ن", sales: 0 };
const localized = (fa: string, en = fa, ar = fa): Localized => ({ ar, en, fa });

const SILVER_SEEDS: SilverSeed[] = [
  { slug: "silver-granules-1g", category: "silver-granules", title: "کپسول ساچمه نقره ۱ گرمی", weight: 1, price: 115_000, sku: "NS-GRN-1", dimensions: "۱ × ۱ گرم", stock: 80, badge: "New" },
  { slug: "silver-capsule-5g", category: "silver-capsules", title: "کپسول ساچمه نقره ۵ گرمی", weight: 5, price: 485_000, sku: "NS-CAP-5", dimensions: "۱ × ۵ گرم", stock: 40, badge: "Top Seller" },
  { slug: "silver-capsule-10g", category: "silver-capsules", title: "پک کپسول نقره ۱۰ گرمی", weight: 10, price: 940_000, sku: "NS-CAP-10", dimensions: "۲ × ۵ گرم", stock: 35 },
  { slug: "silver-capsule-20g", category: "silver-capsules", title: "پک کپسول نقره ۲۰ گرمی", weight: 20, price: 1_840_000, sku: "NS-CAP-20", dimensions: "۴ × ۵ گرم", stock: 28, badge: "Trending" },
  { slug: "silver-capsule-25g", category: "silver-capsules", title: "پک کپسول نقره ۲۵ گرمی", weight: 25, price: 2_280_000, sku: "NS-CAP-25", dimensions: "۵ × ۵ گرم", stock: 22 },
  { slug: "silver-bar-1000g", category: "silver-bars", title: "شمش نقره یک کیلوگرمی", weight: 1000, price: 87_500_000, sku: "BAR-999-1000", dimensions: "۱۰۰۰ گرم", stock: 6, badge: "Power Elite" },
];

function makeSilverProduct(seed: SilverSeed, index: number): Product {
  const isBar = seed.category === "silver-bars";
  const form = isBar ? "شمش" : "کپسول ساچمه";
  const shortFa = isBar
    ? "شمش صنعتی و سرمایه‌گذاری نقره با عیار ۹۹۹، وزن تضمین‌شده و گواهی آنالیز."
    : `${seed.dimensions} نقره خالص عیار ۹۹۹ در بسته‌بندی پلمب؛ مناسب هدیه و سرمایه‌گذاری.`;
  return {
    id: seed.slug,
    slug: seed.slug,
    category: seed.category,
    categoryLabel: productCategoryFallbackLabel(seed.category, "fa"),
    tags: ["نقره", "عیار ۹۹۹", form, "گواهی اصالت"],
    price: seed.price,
    currency: "TOMAN",
    rating: 4.9 - index * 0.01,
    reviews: 18 + index * 7,
    sales: 240 - index * 21,
    lastUpdate: "2026-07-27",
    created: "2026-07-27",
    version: `${seed.weight}g`,
    license: "Regular",
    framework: [form, "عیار ۹۹۹"],
    databases: ["بسته‌بندی پلمب"],
    cover: "",
    preview: "",
    badge: seed.badge,
    author,
    title: localized(seed.title),
    short: localized(shortFa),
    description: localized(`## ${seed.title}\n${shortFa}\n\n## مشخصات محصول\n- وزن خالص: ${seed.weight.toLocaleString("fa-IR")} گرم\n- خلوص: ۹۹۹ از ۱۰۰۰\n- بسته‌بندی پلمب و قابل رهگیری\n- همراه با گواهی اصالت و مشخصات عیار\n\n## تحویل و نگهداری\nمحصول پس از کنترل نهایی، در بسته محافظ ارسال می‌شود و امکان ثبت درخواست تحویل فیزیکی از حساب کاربری وجود دارد.`),
    features: [
      localized(`وزن خالص ${seed.weight.toLocaleString("fa-IR")} گرم`),
      localized("نقره با عیار ۹۹۹"),
      localized("بسته‌بندی پلمب و ضد دست‌کاری"),
      localized("گواهی اصالت و مشخصات عیار"),
      localized("مناسب سرمایه‌گذاری و هدیه"),
      localized("تحویل امن و قابل رهگیری"),
    ],
    gallery: [],
    changelog: [{ version: "1.0", date: "2026-07-27", notes: localized("مشخصات عیار، بسته‌بندی و تصویر محصول تأیید شد.") }],
    faqs: [
      { q: localized("آیا محصول گواهی اصالت دارد؟"), a: localized("بله، محصول با گواهی اصالت و مشخصات وزن و عیار تحویل می‌شود.") },
      { q: localized("بسته‌بندی چگونه است؟"), a: localized("محصول در بسته محافظ پلمب و قابل رهگیری ارسال می‌شود.") },
    ],
    silver: {
      certificateType: "گواهی اصالت و مشخصات عیار",
      countryOfOrigin: "ایران",
      dimensions: seed.dimensions,
      formFactor: form,
      manufacturer: "تولیدکننده معتبر",
      packaging: isBar ? "بسته‌بندی محافظ شمش" : "کپسول شفاف و جعبه پلمب",
      purity: 999,
      sku: seed.sku,
      stockQuantity: seed.stock,
      weightGrams: seed.weight,
    },
  };
}

export const PRODUCTS: Product[] = SILVER_SEEDS.map(makeSilverProduct);
export const PRODUCT_CATEGORIES = Array.from(new Set(PRODUCTS.map((product) => product.category)));
export const PRODUCT_TAGS = Array.from(new Set(PRODUCTS.flatMap((product) => product.tags)));

export function getProduct(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function relatedProducts(slug: string, count = 4) {
  const current = getProduct(slug);
  if (!current) return [];
  return PRODUCTS.filter((product) => product.slug !== slug)
    .sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category))
    .slice(0, count);
}

export function formatPrice(product: Product) {
  const price = product.salePrice ?? product.price;
  if (["IRR", "RIAL", "IRT", "TOMAN"].includes(product.currency.toUpperCase())) return formatTomanMoney(price, product.currency);
  return `${price.toLocaleString("en-US")} ${product.currency}`;
}

export function productCategoryLabel(
  product: Pick<Product, "category" | "categoryLabel">,
  lang: Lang | string = "fa",
) {
  const databaseLabel = product.categoryLabel?.trim();
  return databaseLabel || productCategoryFallbackLabel(String(product.category), lang);
}

function productCategoryFallbackLabel(category: string, lang: Lang | string) {
  const labels: Record<string, Record<string, string>> = {
    "silver-bars": { ar: "سبائك الفضة", en: "Silver bars", fa: "شمش نقره" },
    "silver-capsules": { ar: "كبسولات الفضة", en: "Silver capsules", fa: "کپسول نقره" },
    "silver-granules": { ar: "حبيبات الفضة", en: "Silver granules", fa: "ساچمه نقره" },
  };
  return labels[category]?.[lang] ?? labels[category]?.fa ?? category;
}
