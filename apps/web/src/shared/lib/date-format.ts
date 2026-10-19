export type DateInput = Date | number | string;

type DateFormatOptions = Intl.DateTimeFormatOptions;

const DEFAULT_DATE_OPTIONS = { dateStyle: "medium" } satisfies DateFormatOptions;

export function formatPlatformDate(value: DateInput, options: DateFormatOptions = DEFAULT_DATE_OPTIONS, lang = getActiveLanguage()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    return new Intl.DateTimeFormat(dateLocaleForLanguage(lang), options).format(date);
  } catch {
    return String(value);
  }
}

export function dateLocaleForLanguage(lang?: string | null) {
  const primary = (lang ?? "fa").split("-")[0]?.toLowerCase();
  if (primary === "fa") return "fa-IR-u-ca-persian";
  if (primary === "ar") return "ar-u-ca-gregory";
  if (primary === "en") return "en-US-u-ca-gregory";
  return `${lang || "en-US"}-u-ca-gregory`;
}

/** Convert canonical Iranian E.164 numbers to their familiar local display form. */
export function formatMobileDisplay(value?: string | null) {
  if (!value) return "";
  const normalized = value
    .replace(/[۰-۹٠-٩]/g, (digit) => {
      const persian = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
      if (persian >= 0) return String(persian);
      const arabic = "٠١٢٣٤٥٦٧٨٩".indexOf(digit);
      return arabic >= 0 ? String(arabic) : digit;
    })
    .trim()
    .replace(/[\s()-]/g, "");

  if (/^\+98\d{10}$/.test(normalized)) return `0${normalized.slice(3)}`;
  if (/^0098\d{10}$/.test(normalized)) return `0${normalized.slice(4)}`;
  if (/^98\d{10}$/.test(normalized)) return `0${normalized.slice(2)}`;
  return normalized;
}

function getActiveLanguage() {
  if (typeof document !== "undefined" && document.documentElement.lang) return document.documentElement.lang;
  if (typeof window !== "undefined") {
    try {
      return window.localStorage.getItem("lang") || "fa";
    } catch {}
  }
  return "fa";
}
