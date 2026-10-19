import { trackReferral } from "./referrals-api";

const ATTRIBUTION_KEY = "noghre:referral-attribution";
const VISITOR_KEY = "noghre:referral-visitor";
const DEFAULT_WINDOW_DAYS = 30;

export interface ReferralAttribution {
  capturedAt: string;
  clickId?: string;
  code: string;
  expiresAt: string;
  visitorId: string;
}

export function readReferralAttribution(): ReferralAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (!value) return null;
    const attribution = JSON.parse(value) as ReferralAttribution;
    if (!attribution.code || !attribution.expiresAt || new Date(attribution.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(ATTRIBUTION_KEY);
      return null;
    }
    return attribution;
  } catch {
    window.localStorage.removeItem(ATTRIBUTION_KEY);
    return null;
  }
}

export function readReferralCheckoutAttribution() {
  const attribution = readReferralAttribution();
  return attribution
    ? { referralClickId: attribution.clickId, referralCode: attribution.code }
    : {};
}

export async function captureReferralAttribution(code: string, landingPath: string, utm: Record<string, string>) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode || typeof window === "undefined") return null;
  const current = readReferralAttribution();
  if (current?.clickId && current.code === normalizedCode) return current;

  const visitorId = referralVisitorId();
  const capturedAt = new Date();
  const attribution: ReferralAttribution = {
    capturedAt: capturedAt.toISOString(),
    code: normalizedCode,
    expiresAt: new Date(capturedAt.getTime() + DEFAULT_WINDOW_DAYS * 86_400_000).toISOString(),
    visitorId,
  };
  window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  try {
    const click = await trackReferral({ code: normalizedCode, landingPath, utm, visitorId }) as { expiresAt?: string; id?: string };
    const tracked = { ...attribution, clickId: click.id, expiresAt: click.expiresAt ?? attribution.expiresAt };
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(tracked));
    return tracked;
  } catch {
    if (current) {
      window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
      return current;
    }
    window.localStorage.removeItem(ATTRIBUTION_KEY);
    return null;
  }
}

function referralVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;
  const generated = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(VISITOR_KEY, generated);
  return generated;
}
