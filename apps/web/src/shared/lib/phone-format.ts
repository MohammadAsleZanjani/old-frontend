/** Convert canonical Iranian E.164 numbers to their familiar local display form. */
export function formatMobileDisplay(value?: string | null) {
  if (!value) return "";
  const normalized = toLatinDigits(value).trim().replace(/[\s()-]/g, "");
  if (/^\+98\d{10}$/.test(normalized)) return `0${normalized.slice(3)}`;
  if (/^0098\d{10}$/.test(normalized)) return `0${normalized.slice(4)}`;
  if (/^98\d{10}$/.test(normalized)) return `0${normalized.slice(2)}`;
  return normalized;
}

/** Keep a form mobile value in the expected Iranian national format. */
export function normalizeIranianMobileInput(value: string) {
  return toLatinDigits(value).replace(/\D/g, "").slice(0, 11);
}

export function isValidIranianMobile(value: string) {
  return /^09\d{9}$/.test(normalizeIranianMobileInput(value));
}

export function toCanonicalIranianMobile(value: string) {
  const national = normalizeIranianMobileInput(value);
  return isValidIranianMobile(national) ? `+98${national.slice(1)}` : national;
}

export function normalizeOtpInput(value: string) {
  return toLatinDigits(value).replace(/\D/g, "").slice(0, 6);
}

export function toLatinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
    if (persian >= 0) return String(persian);
    const arabic = "٠١٢٣٤٥٦٧٨٩".indexOf(digit);
    return arabic >= 0 ? String(arabic) : digit;
  });
}
