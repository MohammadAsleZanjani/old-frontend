"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleDollarSign, FileText, Link2, UserRound, WalletCards } from "lucide-react";
import Link from "next/link";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { getAdminWalletTransaction, type AdminWalletTransactionDetail } from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { AdminWalletDirectionBadge } from "@/features/admin/components/AdminWalletDirectionBadge";
import { formatWalletAmount, walletTypeLabels, walletUserName } from "@/features/admin/lib/admin-wallet-transaction-display";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatMobileDisplay, formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

export function AdminWalletTransactionDetailPage({ transactionId }: { transactionId: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("silver.wallets.view"));
  const transaction = useQuery({ enabled: allowed, queryFn: () => getAdminWalletTransaction(transactionId), queryKey: ["admin-wallet-transaction", transactionId], retry: 1 });

  if (overview.isLoading || transaction.isLoading) return <AdminShell><DetailSkeleton /></AdminShell>;
  if (overview.isError || transaction.isError) { const error = overview.error ?? transaction.error; return <AdminShell access={access}><Alert variant="destructive"><AlertTitle>{t("Wallet transaction details unavailable")}</AlertTitle><AlertDescription>{error instanceof Error ? error.message : t("Something went wrong")}</AlertDescription></Alert></AdminShell>; }
  if (!allowed || !transaction.data) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("You do not have permission to view wallet transactions.")}</AlertDescription></Alert></AdminShell>;

  const item = transaction.data;
  const related = relatedDetails(item, t, lang);
  const metadata = metadataDetails(item.metadata, t, lang);

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3"><Button asChild size="sm" variant="ghost"><Link href="/admin/finance/wallet-transactions"><ArrowRight className="size-4" />{t("Back to wallet transactions")}</Link></Button><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{t("Finance")}</Badge><AdminWalletDirectionBadge direction={item.direction} t={t} /><Badge variant="secondary">{t(item.status)}</Badge></div><h2 className="text-2xl font-bold md:text-3xl">{t("Wallet transaction details")}</h2><p className="font-mono text-xs text-muted-foreground" dir="ltr">{item.id}</p></div>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/admin/users/${item.userId}/edit` as never}><UserRound className="size-4" />{t("User profile")}</Link></Button>{sourceHref(item) ? <Button asChild><Link href={sourceHref(item) as never}><Link2 className="size-4" />{t("Open related record")}</Link></Button> : null}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailMetric icon={CircleDollarSign} label={t("Transaction amount")} tone={item.direction === "INCREASE" ? "increase" : "decrease"} value={formatWalletAmount(item.amount, item.wallet.currency, lang, t)} />
          <DetailMetric icon={WalletCards} label={t("Balance before")} value={formatWalletAmount(item.balanceBefore, item.wallet.currency, lang, t)} />
          <DetailMetric icon={WalletCards} label={t("Balance after transaction")} value={formatWalletAmount(item.balanceAfter, item.wallet.currency, lang, t)} />
          <DetailMetric icon={FileText} label={t("Exact transaction time")} value={formatPlatformDate(item.createdAt, { dateStyle: "medium", timeStyle: "medium" }, lang)} />
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="rounded-lg bg-card/70"><CardHeader><CardTitle>{t("Transaction reason and description")}</CardTitle></CardHeader><CardContent className="space-y-4"><Detail label={t("Credit direction")} value={t(item.direction === "INCREASE" ? "Credit increase" : "Credit decrease")} /><Detail label={t("Transaction type")} value={t(walletTypeLabels[item.type])} /><Detail label={t("Full transaction description")} value={item.description} /><Detail label={t("Wallet type")} value={t(item.wallet.currency === "TOMAN" ? "Toman wallet" : "Silver wallet")} /><Detail label={t("Status")} value={t(item.status)} /></CardContent></Card>

          <Card className="rounded-lg bg-card/70"><CardHeader><CardTitle>{t("User and wallet")}</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="text-xs text-muted-foreground">{t("User first and last name")}</p><AdminUserLink className="mt-1 inline-block text-base" userId={item.user.id}>{walletUserName(item.user)}</AdminUserLink></div><Detail dir="ltr" label={t("Mobile")} value={formatMobileDisplay(item.user.mobile) || "—"} /><Detail dir="ltr" label={t("Email")} value={item.user.email || "—"} /><Detail dir="ltr" label={t("Wallet ID")} value={item.walletId} /><Detail label={t("Current wallet balance")} value={formatWalletAmount(item.wallet.balance, item.wallet.currency, lang, t)} /></CardContent></Card>

          <Card className="rounded-lg bg-card/70 xl:col-span-2"><CardHeader><CardTitle>{t("References and identifiers")}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Detail dir="ltr" label={t("Transaction ID")} value={item.id} /><Detail dir="ltr" label={t("Reference")} value={item.reference || "—"} /><Detail dir="ltr" label={t("Silver order ID")} value={item.orderId || "—"} /><Detail dir="ltr" label={t("Payment ID")} value={item.paymentId || "—"} /><Detail dir="ltr" label={t("Created by")} value={item.createdBy ? `${walletUserName(item.createdBy)} · ${item.createdBy.id}` : item.createdById || t("System")} /><Detail label={t("Recorded at")} value={formatPlatformDate(item.createdAt, { dateStyle: "full", timeStyle: "medium" }, lang)} /></CardContent></Card>

          {related.length ? <Card className="rounded-lg bg-card/70 xl:col-span-2"><CardHeader><CardTitle>{t("Related operation details")}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{related.map((entry) => <Detail dir={entry.dir} key={`${entry.label}-${entry.value}`} label={entry.label} value={entry.value} />)}</CardContent></Card> : null}

          {metadata.length ? <Card className="rounded-lg bg-card/70 xl:col-span-2"><CardHeader><CardTitle>{t("Additional recorded information")}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{metadata.map((entry) => <Detail dir={entry.dir} key={entry.label} label={entry.label} value={entry.value} />)}</CardContent></Card> : null}
        </div>
      </div>
    </AdminShell>
  );
}

function DetailMetric({ icon: Icon, label, tone = "default", value }: { icon: typeof WalletCards; label: string; tone?: "default" | "decrease" | "increase"; value: string }) {
  const toneClass = { default: "bg-primary/10 text-primary", decrease: "bg-rose-500/10 text-rose-700 dark:text-rose-300", increase: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" }[tone];
  return <Card className="rounded-lg bg-card/70"><CardContent className="flex items-center gap-4 p-5"><span className={`grid size-11 shrink-0 place-items-center rounded-lg ${toneClass}`}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-lg font-bold">{value}</p></div></CardContent></Card>;
}

function Detail({ dir, label, value }: { dir?: "ltr" | "rtl"; label: string; value: string }) { return <div className="rounded-lg border border-border bg-background/35 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 break-words font-semibold" dir={dir}>{value}</p></div>; }

function relatedDetails(item: AdminWalletTransactionDetail, t: (text: string) => string, lang: string) {
  const rows: Array<{ dir?: "ltr" | "rtl"; label: string; value: string }> = [];
  const add = (label: string, value: unknown, dir?: "ltr" | "rtl") => { const formatted = formatUnknown(value, lang); if (formatted) rows.push({ dir, label: t(label), value: formatted }); };
  const order = record(item.order); if (order) { add("Silver order", order.orderNumber, "ltr"); add("Order type", order.type); add("Silver weight", order.grams); add("Final order total", order.totalToman); }
  const payment = record(item.payment); if (payment) { add("Payment", payment.paymentNumber, "ltr"); add("Gateway", payment.gateway); add("Provider reference", payment.referenceId, "ltr"); add("Payment status", payment.status); }
  const withdrawal = record(item.tomanWithdrawal); if (withdrawal) { add("Withdrawal request", withdrawal.requestNumber, "ltr"); add("Withdrawal amount", withdrawal.amount); add("Net amount", withdrawal.netAmount); add("Bank tracking code", withdrawal.providerTrackingCode, "ltr"); }
  const gift = record(item.gift); if (gift) { add("Gift number", gift.giftNumber, "ltr"); add("Gift status", gift.status); add("Gift message", gift.message); add("Silver gift amount", gift.silverGrams); add("Reserved gift amount", gift.reservedSilverGrams); add("Gift product", gift.productTitle); add("Gift recipient", gift.recipientMobile, "ltr"); }
  const promotion = record(item.promotionRedemption); if (promotion) { add("Promotion code", promotion.code, "ltr"); add("Promotion name", record(promotion.promotion)?.name); add("Reward value", promotion.walletCreditAmount); add("Reward status", promotion.status); }
  const referral = record(item.referralReward); if (referral) { add("Referral reward", referral.amount); add("Reward status", referral.status); add("Reward currency", referral.currency); }
  const kycReward = record(item.referralKycReward); if (kycReward) { add("Registration reward", kycReward.amount); add("Reward role", kycReward.role); add("Reward status", kycReward.status); add("Referred user", walletUserName(record(kycReward.referredUser))); }
  const acquisition = record(item.acquisitionReward); if (acquisition) { add("Campaign", record(acquisition.campaign)?.name); add("Campaign reward", acquisition.amount); add("Reward type", acquisition.rewardType); add("Reward status", acquisition.status); }
  return rows;
}

function metadataDetails(metadata: unknown, t: (text: string) => string, lang: string) {
  const value = record(metadata);
  if (!value) return [];
  return Object.entries(value).map(([key, item]) => ({ dir: typeof item === "string" && /^[A-Za-z0-9._:-]+$/.test(item) ? "ltr" as const : undefined, label: t(humanize(key)), value: formatUnknown(item, lang) || "—" }));
}

function sourceHref(item: AdminWalletTransactionDetail) {
  if (item.orderId) return `/admin/silver/orders/${item.orderId}`;
  if (item.paymentId) return `/admin/finance/payments/${item.paymentId}`;
  const withdrawal = record(item.tomanWithdrawal);
  if (withdrawal?.requestNumber) return `/admin/finance/withdrawals?search=${encodeURIComponent(String(withdrawal.requestNumber))}`;
  return undefined;
}

function record(value: unknown): Record<string, unknown> | undefined { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
function humanize(value: string) { return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
function formatUnknown(value: unknown, lang: string): string | undefined { if (value === null || value === undefined || value === "") return undefined; if (typeof value === "number") return value.toLocaleString(lang); if (typeof value === "boolean") return value ? "✓" : "✕"; if (typeof value === "string") return value; try { return JSON.stringify(value); } catch { return String(value); } }
function DetailSkeleton() { return <div className="space-y-6"><ShadowSkeleton className="h-32" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><div className="grid gap-5 xl:grid-cols-2"><ShadowSkeleton className="h-80" /><ShadowSkeleton className="h-80" /><ShadowSkeleton className="h-72 xl:col-span-2" /></div></div>; }
