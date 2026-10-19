const LEGACY_RIAL_CURRENCIES = new Set(["IRR", "RIAL", "R", "ریال"]);
const TOMAN_CURRENCIES = new Set(["TOMAN", "IRT", "تومان"]);

export function isLegacyRialCurrency(currency?: string | null) {
  return LEGACY_RIAL_CURRENCIES.has(currency?.trim().toUpperCase() ?? "");
}

export function isTomanCurrency(currency?: string | null) {
  const normalized = currency?.trim().toUpperCase() ?? "";
  return TOMAN_CURRENCIES.has(normalized) || LEGACY_RIAL_CURRENCIES.has(normalized);
}

export function tomanAmount(value: number | string | null | undefined, currency = "TOMAN") {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  const finiteAmount = Number.isFinite(amount) ? amount : 0;
  return isLegacyRialCurrency(currency) ? finiteAmount / 10 : finiteAmount;
}

export function formatTomanMoney(
  value: number | string | null | undefined,
  currency = "TOMAN",
  locale = "fa-IR",
) {
  const amount = tomanAmount(value, currency);
  const label = locale.startsWith("fa") ? "تومان" : "Toman";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(amount))} ${label}`;
}

export function parseTomanInput(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^0-9]/g, "");
  const amount = Number(normalized);
  return Number.isSafeInteger(amount) ? amount : 0;
}

