export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

export function formatToman(value: number | string) {
  const amount = Number(value);
  return `${toPersianDigits(new Intl.NumberFormat("fa-IR").format(Number.isFinite(amount) ? amount : 0))} تومان`;
}

export function formatGram(value: number | string) {
  const amount = Number(value);
  return `${toPersianDigits(new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(Number.isFinite(amount) ? amount : 0))} گرم`;
}

export function formatJalaliDate(value: string | number | Date = new Date()) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatSilverPriceTimestamp(value: string | number | Date) {
  const normalized = typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ? value.replace(" ", "T")
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
