export type ProductWeightUnit = "GRAM" | "KILOGRAM";

export type ProductWeightTaxonomyItem = {
  name?: string;
  slug: string;
  weightGrams?: number | string | null;
};

export function productWeightGrams(value: string | number, unit: ProductWeightUnit) {
  const amount = typeof value === "number" ? value : parseLocalizedNumber(value);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const grams = unit === "KILOGRAM" ? amount * 1_000 : amount;
  if (grams > 9_999_999.999) return undefined;
  return Number(grams.toFixed(3));
}

export function taxonomyWeightGrams(item: ProductWeightTaxonomyItem) {
  const explicit = Number(item.weightGrams);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return parseWeightText(item.name) ?? parseWeightText(item.slug.replace(/(\d)p(\d)/g, "$1.$2"));
}

export function productWeightLabel(grams: number, locale = "fa-IR") {
  if (grams >= 1_000) {
    return `${formatNumber(grams / 1_000, locale)} کیلوگرم (${formatNumber(grams, locale)} گرم)`;
  }
  return `${formatNumber(grams, locale)} گرم`;
}

export function productWeightSlug(grams: number) {
  return `silver-weight-${formatCanonicalNumber(grams).replace(".", "p")}-gram`;
}

export function weightInputValue(grams: number, unit: ProductWeightUnit) {
  const value = unit === "KILOGRAM" ? grams / 1_000 : grams;
  return Number.isFinite(value) && value > 0 ? formatCanonicalNumber(value) : "";
}

export function preferredWeightUnit(grams: number, source?: string): ProductWeightUnit {
  const normalized = source?.toLowerCase() ?? "";
  if (normalized.includes("kg") || normalized.includes("kilogram") || normalized.includes("کیلو")) return "KILOGRAM";
  return grams >= 1_000 ? "KILOGRAM" : "GRAM";
}

function parseWeightText(value?: string | null) {
  if (!value) return undefined;
  const normalized = normalizeDigits(value)
    .replace(/[٫,]/g, ".")
    .replace(/٬/g, "")
    .replace(/[-_]/g, " ");
  const kg = normalized.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms|کیلو\s*گرم)/i);
  if (kg) return positive(Number(kg[1]) * 1_000);
  const grams = normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|گرم)/i);
  if (grams) return positive(Number(grams[1]));
  const number = normalized.match(/\d+(?:\.\d+)?/);
  return number ? positive(Number(number[0])) : undefined;
}

function parseLocalizedNumber(value: string) {
  return Number(normalizeDigits(value).replace(/[٫,]/g, ".").replace(/٬/g, "").trim());
}

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function positive(value: number) {
  return Number.isFinite(value) && value > 0 ? Number(value.toFixed(3)) : undefined;
}

function formatCanonicalNumber(value: number) {
  return value.toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value);
}
