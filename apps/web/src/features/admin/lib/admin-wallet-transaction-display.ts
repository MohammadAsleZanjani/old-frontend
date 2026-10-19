import type { AdminWalletCurrency, AdminWalletTransactionType } from "@/features/admin/api/admin-silver-api";

export const walletTypeLabels: Record<AdminWalletTransactionType, string> = {
  ADJUSTMENT: "Manual balance adjustment",
  BUY: "Silver purchase",
  DELIVERY: "Delivery cost",
  DEPOSIT: "Wallet top-up",
  FEE: "Fee deduction",
  GIFT: "Gift transfer",
  PROMOTION: "Promotion reward",
  REFERRAL: "Referral reward",
  SELL: "Silver sale settlement",
  WITHDRAW: "Wallet withdrawal",
};

export function formatWalletAmount(value: string, currency: AdminWalletCurrency, lang: string, t: (text: string) => string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return currency === "TOMAN" ? `${amount.toLocaleString(lang, { maximumFractionDigits: 0 })} ${t("Toman")}` : `${amount.toLocaleString(lang, { maximumFractionDigits: 3 })} ${t("grams")}`;
}

export function walletUserName(user?: { email?: string | null; id?: string; mobile?: string | null; profile?: { firstName?: string | null; lastName?: string | null } | null } | null) {
  if (!user) return "—";
  return [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.mobile || user.email || user.id || "—";
}
