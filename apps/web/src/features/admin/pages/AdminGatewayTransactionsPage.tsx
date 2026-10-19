"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, CreditCard, Eye, Search, WalletCards } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import {
  getAdminGatewayTransactions,
  getAdminOverview,
  type AdminGatewayTransaction,
  type AdminGatewayTransactionEffectStatus,
  type AdminGatewayTransactionPurpose,
} from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatMobileDisplay, formatPlatformDate } from "@/shared/lib/date-format";
import { formatTomanMoney } from "@/shared/lib/toman-money";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const PURPOSES: AdminGatewayTransactionPurpose[] = ["WALLET_TOP_UP", "SILVER_PURCHASE", "PRODUCT_PURCHASE", "OTHER"];
const STATUSES = ["CREATED", "PENDING", "PROCESSING", "VERIFYING", "PAID", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED"];

export function AdminGatewayTransactionsPage({ initialUserId }: { initialUserId?: string }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [status, setStatus] = useState("ALL");
  const [purpose, setPurpose] = useState<"ALL" | AdminGatewayTransactionPurpose>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("payments.view"));
  const transactions = useQuery({
    enabled: allowed,
    queryFn: () => getAdminGatewayTransactions({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      pageSize: 20,
      purpose: purpose === "ALL" ? undefined : purpose,
      search: deferredSearch || undefined,
      sortOrder,
      status: status === "ALL" ? undefined : status,
      userId: initialUserId,
    }),
    queryKey: ["admin-gateway-transactions", dateFrom, dateTo, deferredSearch, initialUserId, page, purpose, sortOrder, status],
    retry: 1,
  });
  const items = useMemo(() => transactions.data?.items ?? [], [transactions.data?.items]);
  const summary = transactions.data?.summary;
  const needsReview = items.filter((item) => item.effectStatus === "MISSING").length;

  if (overview.isLoading) return <AdminShell><GatewayTransactionsSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Gateway transactions unavailable")}</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("You do not have permission to view gateway transactions.")}</AlertDescription></Alert></AdminShell>;

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setPurpose("ALL");
    setSearch("");
    setSortOrder("desc");
    setStatus("ALL");
  };

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Finance / Gateway")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Gateway transactions")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("See the exact amount paid through the online gateway, why it was paid, and whether the related wallet, silver, or product effect was applied.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={transactions.isLoading || (transactions.data?.total ?? 0) === 0}
              fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminGatewayTransactions({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page: exportPage, pageSize, purpose: purpose === "ALL" ? undefined : purpose, search: deferredSearch || undefined, sortOrder, status: status === "ALL" ? undefined : status, userId: initialUserId }))}
              filename="gateway-transactions"
              sheetName={t("Gateway transactions")}
            />
            <Button asChild variant="outline"><Link href="/admin/finance/payments">{t("All payment methods")}</Link></Button>
          </div>
        </section>

        <Alert>
          <CreditCard className="size-4" />
          <AlertTitle>{t("Gateway reconciliation view")}</AlertTitle>
          <AlertDescription>{t("This report is read-only. It matches each external gateway payment to its invoice and resulting wallet credit, silver purchase, or product order without changing financial data.")}</AlertDescription>
        </Alert>

        {initialUserId ? (
          <Alert>
            <AlertTitle>{t("Selected user records")}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{t("This list is limited to gateway transactions belonging to the selected user.")}</span>
              <Button asChild size="sm" variant="outline"><Link href="/admin/finance/gateway-transactions">{t("Show all users")}</Link></Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={CreditCard} label={t("All gateway attempts")} value={(summary?.totalCount ?? 0).toLocaleString(lang)} />
          <Metric icon={BadgeCheck} label={t("Successful gateway payments")} tone="success" value={(summary?.paidCount ?? 0).toLocaleString(lang)} />
          <Metric icon={WalletCards} label={t("Amount paid through gateway")} tone="primary" value={formatTomanMoney(summary?.paidAmount ?? 0, "TOMAN", lang === "fa" ? "fa-IR" : "en-US")} />
          <Metric icon={needsReview ? AlertTriangle : BadgeCheck} label={t("Effects needing review on this page")} tone={needsReview ? "danger" : "success"} value={needsReview.toLocaleString(lang)} />
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{t("Online gateway ledger")}</CardTitle>
              <Button disabled={!search && status === "ALL" && purpose === "ALL" && !dateFrom && !dateTo && sortOrder === "desc"} onClick={clearFilters} size="sm" variant="outline">{t("Clear filters")}</Button>
            </div>
            <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_190px_190px_170px_170px_170px]">
              <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search payment, reference, authority, mobile, or customer")} value={search} /></div>
              <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value); }} value={status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("All statuses")}</SelectItem>{STATUSES.map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}</SelectContent></Select>
              <Select dir={dir} onValueChange={(value: "ALL" | AdminGatewayTransactionPurpose) => { setPage(1); setPurpose(value); }} value={purpose}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("All payment purposes")}</SelectItem>{PURPOSES.map((item) => <SelectItem key={item} value={item}>{t(purposeLabel(item))}</SelectItem>)}</SelectContent></Select>
              <Input aria-label={t("From date")} max={dateTo || undefined} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} type="date" value={dateFrom} />
              <Input aria-label={t("To date")} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} type="date" value={dateTo} />
              <Select dir={dir} onValueChange={(value: "asc" | "desc") => { setPage(1); setSortOrder(value); }} value={sortOrder}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">{t("Newest first")}</SelectItem><SelectItem value="asc">{t("Oldest first")}</SelectItem></SelectContent></Select>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.isLoading ? <TableSkeleton /> : null}
            {transactions.isError ? <Alert variant="destructive"><AlertTitle>{t("Gateway transaction list unavailable")}</AlertTitle><AlertDescription>{transactions.error.message}</AlertDescription></Alert> : null}
            {!transactions.isLoading && !transactions.isError && items.length ? <GatewayTransactionsTable items={items} lang={lang} /> : null}
            {!transactions.isLoading && !transactions.isError && !items.length ? <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">{t("No gateway transactions match the current filters.")}</div> : null}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{t("Showing")} {items.length.toLocaleString(lang)} {t("of")} {(transactions.data?.total ?? 0).toLocaleString(lang)} {t("transactions")}.</p><div className="flex gap-2"><Button disabled={page <= 1 || transactions.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button><Button disabled={page >= (transactions.data?.totalPages ?? 1) || transactions.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button></div></div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function GatewayTransactionsTable({ items, lang }: { items: AdminGatewayTransaction[]; lang: string }) {
  const t = (text: string) => translateUiText(text, lang);
  return <div className="overflow-x-auto"><Table className="min-w-[1900px]"><TableHeader><TableRow><TableHead>{t("Payment and time")}</TableHead><TableHead>{t("Customer")}</TableHead><TableHead>{t("Exact gateway amount")}</TableHead><TableHead>{t("Payment purpose")}</TableHead><TableHead>{t("Resulting financial effect")}</TableHead><TableHead>{t("Gateway references")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead className="text-start">{t("Actions")}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="min-w-56 align-top"><Link className="font-semibold hover:text-primary" href={`/admin/finance/payments/${item.id}` as never}>{item.paymentNumber}</Link><p className="mt-1 text-xs text-muted-foreground">{formatPlatformDate(item.paidAt ?? item.createdAt, { dateStyle: "medium", timeStyle: "medium" }, lang)}</p><p className="mt-1 max-w-52 truncate font-mono text-[11px] text-muted-foreground" dir="ltr" title={item.id}>{item.id}</p></TableCell><TableCell className="min-w-56 align-top"><AdminUserLink userId={item.user?.id}>{customerName(item)}</AdminUserLink><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{formatMobileDisplay(item.user?.mobile) || item.user?.email || "—"}</p></TableCell><TableCell className="min-w-44 align-top"><p className="text-lg font-extrabold text-primary tabular-nums">{formatTomanMoney(item.amount, item.currency, lang === "fa" ? "fa-IR" : "en-US")}</p>{item.invoiceAmountMatches === false ? <Badge className="mt-2" variant="destructive">{t("Invoice amount mismatch")}</Badge> : <p className="mt-2 text-xs text-muted-foreground">{t("Recorded gateway payment amount")}</p>}</TableCell><TableCell className="min-w-48 align-top"><Badge variant="outline">{t(purposeLabel(item.purpose))}</Badge><RelatedRecord item={item} lang={lang} /></TableCell><TableCell className="min-w-72 align-top"><EffectBadge status={item.effectStatus} t={t} /><EffectDetails item={item} lang={lang} /></TableCell><TableCell className="min-w-64 align-top"><Reference label={t("Reference")} value={item.referenceId} /><Reference label={t("Transaction")} value={item.transactionId} /><Reference label={t("Authority")} value={item.authority} />{item.cardPan ? <p className="mt-2 font-mono text-xs" dir="ltr">{item.cardPan}</p> : null}</TableCell><TableCell className="min-w-48 align-top"><Badge variant={paymentStatusVariant(item.status)}>{t(item.status)}</Badge>{item.failureReason ? <p className="mt-2 line-clamp-3 text-xs text-destructive" title={item.failureReason}>{item.failureReason}</p> : null}</TableCell><TableCell className="align-top text-start"><div className="flex flex-col gap-2"><Button asChild size="sm"><Link href={`/admin/finance/payments/${item.id}` as never}><Eye className="size-4" />{t("Full details")}</Link></Button>{item.user?.id ? <Button asChild size="sm" variant="outline"><Link href={`/admin/users/${item.user.id}/edit` as never}>{t("User profile")}</Link></Button> : null}</div></TableCell></TableRow>)}</TableBody></Table></div>;
}

function RelatedRecord({ item, lang }: { item: AdminGatewayTransaction; lang: string }) {
  const t = (text: string) => translateUiText(text, lang);
  if (item.silverOrder) return <p className="mt-2 text-xs"><Link className="font-medium hover:text-primary" href={`/admin/silver/orders/${item.silverOrder.id}` as never}>{item.silverOrder.orderNumber}</Link><span className="text-muted-foreground"> · {item.silverOrder.grams} {t("grams")}</span></p>;
  if (item.order) return <p className="mt-2 text-xs"><Link className="font-medium hover:text-primary" href={`/admin/shop/orders/${item.order.id}` as never}>{item.order.orderNumber}</Link></p>;
  if (item.invoice) return <p className="mt-2 text-xs"><Link className="font-medium hover:text-primary" href={`/admin/finance/invoices/${item.invoice.id}` as never}>{item.invoice.invoiceNumber}</Link></p>;
  return <p className="mt-2 text-xs text-muted-foreground">{t("No related financial record")}</p>;
}

function EffectDetails({ item, lang }: { item: AdminGatewayTransaction; lang: string }) {
  const t = (text: string) => translateUiText(text, lang);
  if (item.purpose === "WALLET_TOP_UP" && item.walletTransaction) return <div className="mt-2 text-xs leading-6"><p className="font-semibold text-emerald-600">+ {formatTomanMoney(item.walletTransaction.amount, "TOMAN", lang === "fa" ? "fa-IR" : "en-US")}</p><p className="text-muted-foreground">{t("Wallet balance after credit")}: {formatTomanMoney(item.walletTransaction.balanceAfter, "TOMAN", lang === "fa" ? "fa-IR" : "en-US")}</p></div>;
  if (item.purpose === "SILVER_PURCHASE" && item.silverOrder) return <div className="mt-2 text-xs leading-6"><p className="font-semibold">+ {item.silverOrder.grams} {t("grams of silver")}</p><p className="text-muted-foreground">{t("Silver order status")}: {t(item.silverOrder.status)}</p></div>;
  if (item.purpose === "PRODUCT_PURCHASE" && item.order) return <p className="mt-2 text-xs leading-6 text-muted-foreground">{t("Product order status")}: {t(item.order.status)}</p>;
  return <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.effectStatus === "MISSING" ? t("A paid transaction has no matching downstream effect and should be reviewed.") : t("No downstream financial effect applies yet.")}</p>;
}

function EffectBadge({ status, t }: { status: AdminGatewayTransactionEffectStatus; t: (text: string) => string }) {
  const variant = status === "MISSING" ? "destructive" : status === "APPLIED" ? "default" : "secondary";
  return <Badge variant={variant}>{t(effectLabel(status))}</Badge>;
}

function Reference({ label, value }: { label: string; value?: string | null }) { return <p className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="max-w-40 truncate font-mono" dir="ltr" title={value ?? undefined}>{value ?? "—"}</span></p>; }
function customerName(item: AdminGatewayTransaction) { return [item.user?.profile?.firstName, item.user?.profile?.lastName].filter(Boolean).join(" ") || item.user?.email || formatMobileDisplay(item.user?.mobile) || "—"; }
function purposeLabel(purpose: AdminGatewayTransactionPurpose) { return ({ WALLET_TOP_UP: "Wallet top-up", SILVER_PURCHASE: "Direct silver purchase", PRODUCT_PURCHASE: "Product purchase", OTHER: "Other payment" })[purpose]; }
function effectLabel(status: AdminGatewayTransactionEffectStatus) { return ({ APPLIED: "Financial effect applied", MISSING: "Effect missing - review", NOT_APPLICABLE: "Not paid yet", PENDING: "Effect pending" })[status]; }
function paymentStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" { if (status === "PAID") return "default"; if (["FAILED", "CANCELLED", "EXPIRED"].includes(status)) return "destructive"; if (["PROCESSING", "VERIFYING"].includes(status)) return "secondary"; return "outline"; }

function Metric({ icon: Icon, label, tone = "default", value }: { icon: typeof CreditCard; label: string; tone?: "danger" | "default" | "primary" | "success"; value: string }) {
  const toneClass = { danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300", default: "bg-muted text-foreground", primary: "bg-primary/10 text-primary", success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" }[tone];
  return <Card className="rounded-lg border-border bg-card/70"><CardContent className="flex items-center gap-4 p-5"><div className={`grid size-11 place-items-center rounded-lg ${toneClass}`}><Icon className="size-5" /></div><div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 truncate text-2xl font-bold" title={value}>{value}</p></div></CardContent></Card>;
}

function TableSkeleton() { return <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-16" key={index} />)}</div>; }
function GatewayTransactionsSkeleton() { return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-24" key={index} />)}</div><ShadowSkeleton className="h-[42rem]" /></div>; }
