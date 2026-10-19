import type { Product } from "./products-data";

const localized = (fa: string) => ({ ar: fa, en: fa, fa });
const author = { avatar: "ن", level: "", name: "نقره لند", sales: 0 };

function silverProduct(input: {
  category: "silver-bars" | "silver-capsules" | "silver-granules";
  price: number;
  short: string;
  sku: string;
  slug: string;
  title: string;
  weight: number;
  dimensions: string;
}): Product {
  return {
    author,
    badge: input.category === "silver-capsules" ? "New" : undefined,
    category: input.category as Product["category"],
    changelog: [],
    cover: "",
    created: "2026-07-27",
    currency: "TOMAN",
    databases: [],
    description: localized(`${input.short}\n\nوزن و عیار محصول روی بسته درج شده و همراه گواهی اصالت تحویل می‌شود.`),
    faqs: [],
    features: [
      localized(`وزن خالص ${input.weight} گرم`),
      localized("نقره با عیار ۹۹۹"),
      localized("بسته‌بندی پلمب و گواهی اصالت"),
    ],
    framework: [],
    gallery: [],
    lastUpdate: "2026-07-27",
    license: "Regular",
    preview: "",
    price: input.price,
    rating: 5,
    reviews: 0,
    sales: 0,
    short: localized(input.short),
    silver: {
      certificateType: "گواهی اصالت و مشخصات عیار",
      countryOfOrigin: "ایران",
      dimensions: input.dimensions,
      formFactor: input.category === "silver-bars" ? "شمش" : "کپسول ساچمه",
      manufacturer: "تولیدکننده معتبر",
      packaging: input.category === "silver-bars" ? "بسته‌بندی محافظ شمش" : "کپسول شفاف و جعبه پلمب",
      purity: 999,
      sku: input.sku,
      stockQuantity: 0,
      weightGrams: input.weight,
    },
    slug: input.slug,
    tags: ["نقره", "عیار ۹۹۹", input.category === "silver-bars" ? "شمش" : "کپسول"],
    title: localized(input.title),
    version: "physical",
  };
}

export const SILVER_PRODUCTS: Product[] = [
  silverProduct({ category: "silver-granules", dimensions: "1 × 1g", price: 115_000, short: "ساچمه نقره خالص ۹۹۹ در کپسول تک‌گرمی و کارت قرمز اصالت.", sku: "NS-GRN-1", slug: "silver-granules-1g", title: "کپسول ساچمه نقره ۱ گرمی", weight: 1 }),
  silverProduct({ category: "silver-capsules", dimensions: "1 × 5g", price: 485_000, short: "یک کپسول ۵ گرمی ساچمه نقره ۹۹۹ در جعبه محافظ پلمب‌شده.", sku: "NS-CAP-5", slug: "silver-capsule-5g", title: "کپسول ساچمه نقره ۵ گرمی", weight: 5 }),
  silverProduct({ category: "silver-capsules", dimensions: "2 × 5g", price: 940_000, short: "دو کپسول ۵ گرمی ساچمه نقره ۹۹۹ با بسته‌بندی هنری و پلمب.", sku: "NS-CAP-10", slug: "silver-capsule-10g", title: "پک کپسول نقره ۱۰ گرمی", weight: 10 }),
  silverProduct({ category: "silver-capsules", dimensions: "4 × 5g", price: 1_840_000, short: "چهار کپسول ۵ گرمی ساچمه نقره ۹۹۹؛ مناسب هدیه و سرمایه‌گذاری.", sku: "NS-CAP-20", slug: "silver-capsule-20g", title: "پک کپسول نقره ۲۰ گرمی", weight: 20 }),
  silverProduct({ category: "silver-capsules", dimensions: "5 × 5g", price: 2_280_000, short: "پنج کپسول ۵ گرمی ساچمه نقره ۹۹۹ در جعبه کلکسیونی.", sku: "NS-CAP-25", slug: "silver-capsule-25g", title: "پک کپسول نقره ۲۵ گرمی", weight: 25 }),
  silverProduct({ category: "silver-bars", dimensions: "1000g", price: 87_500_000, short: "شمش صنعتی و سرمایه‌گذاری ۱۰۰۰ گرمی با عیار ۹۹۹ و گواهی آنالیز.", sku: "BAR-999-1000", slug: "silver-bar-1000g", title: "شمش نقره یک کیلوگرمی", weight: 1000 }),
];
