"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Eye, Gift, Search, WalletCards } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  getAdminWalletTransactions,
  walletTransactionTypes,
  type AdminWalletCurrency,
  type AdminWalletTransaction,
  type AdminWalletTransactionDirection,
  type AdminWalletTransactionType,
} from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { AdminWalletDirectionBadge } from "@/features/admin/components/AdminWalletDirectionBadge";
import { formatWalletAmount, walletTypeLabels, walletUserName } from "@/features/admin/lib/admin-wallet-transaction-display";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatMobileDisplay, formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminWalletTransactionsPage({ initialUserId }: { initialUserId?: string }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [type, setType] = useState<"ALL" | AdminWalletTransactionType>("ALL");
  const [direction, setDirection] = useState<"ALL" | AdminWalletTransactionDirection>("ALL");
  const [currency, setCurrency] = useState<"ALL" | AdminWalletCurrency>("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("silver.wallets.view"));
  const transactions = useQuery({
    enabled: allowed,
    queryFn: () => getAdminWalletTransactions({
      currency: currency === "ALL" ? undefined : currency,
      direction: direction === "ALL" ? undefined : direction,
      page,
      pageSize: 20,
      search: deferredSearch || undefined,
      sortOrder,
      status: status === "ALL" ? undefined : status,
      type: type === "ALL" ? undefined : type,
      userId: initialUserId,
    }),
    queryKey: ["admin-wallet-transactions", currency, deferredSearch, direction, initialUserId, page, sortOrder, status, type],
    retry: 1,
  });
  const items = useMemo(() => transactions.data?.items ?? [], [transactions.data?.items]);
  const summary = transactions.data?.summary;
  const rewards = (summary?.types.GIFT ?? 0) + (summary?.types.PROMOTION ?? 0) + (summary?.types.REFERRAL ?? 0);

  if (overview.isLoading) return <AdminShell><WalletTransactionsSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Wallet transactions unavailable")}</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("You do not have permission to view wallet transactions.")}</AlertDescription></Alert></AdminShell>;

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Finance")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Wallet transactions")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("A complete wallet ledger with transaction direction, exact reason, balances, references, and timestamps down to the second.")}</p>
          </div>
          <AdminExcelExportButton
            disabled={transactions.isLoading || (transactions.data?.total ?? 0) === 0}
            fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminWalletTransactions({ currency: currency === "ALL" ? undefined : currency, direction: direction === "ALL" ? undefined : direction, page: exportPage, pageSize, search: deferredSearch || undefined, sortOrder, status: status === "ALL" ? undefined : status, type: type === "ALL" ? undefined : type, userId: initialUserId }))}
            filename="wallet-transactions"
            sheetName={t("Wallet transactions")}
          />
        </section>

        {initialUserId ? <Alert><AlertTitle>{t("User transactions")}</AlertTitle><AlertDescription className="flex flex-wrap items-center justify-between gap-3"><span>{t("This list is limited to all wallet transactions for the selected user.")}</span><Button asChild size="sm" variant="outline"><Link href="/admin/finance/wallet-transactions">{t("Show all users")}</Link></Button></AlertDescription></Alert> : null}

        <section className="grid gap-4 md:grid-cols-4">
          <WalletMetric icon={WalletCards} label={t("All wallet transactions")} value={summary?.total ?? 0} />
          <WalletMetric icon={ArrowUpCircle} label={t("Credit increases")} tone="increase" value={summary?.increases ?? 0} />
          <WalletMetric icon={ArrowDownCircle} label={t("Credit decreases")} tone="decrease" value={summary?.decreases ?? 0} />
          <WalletMetric icon={Gift} label={t("Gifts and rewards")} tone="reward" value={rewards} />
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <CardTitle>{t("Wallet transaction ledger")}</CardTitle>
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_180px]">
              <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search user, description, reference, or transaction ID")} value={search} /></div>
              <Select dir={dir} onValueChange={(value: "ALL" | AdminWalletTransactionDirection) => { setDirection(value); setPage(1); }} value={direction}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("All directions")}</SelectItem><SelectItem value="INCREASE">{t("Credit increase")}</SelectItem><SelectItem value="DECREASE">{t("Credit decrease")}</SelectItem></SelectContent></Select>
              <Select dir={dir} onValueChange={(value: "ALL" | AdminWalletCurrency) => { setCurrency(value); setPage(1); }} value={currency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("All wallets")}</SelectItem><SelectItem value="TOMAN">{t("Toman wallet")}</SelectItem><SelectItem value="SILVER_GRAM">{t("Silver wallet")}</SelectItem></SelectContent></Select>
              <Select dir={dir} onValueChange={(value) => { setStatus(value); setPage(1); }} value={status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t("All statuses")}</SelectItem>{["COMPLETED", "PENDING", "FAILED", "CANCELLED"].map((item) => <SelectItem key={item} value={item}>{t(item)}</SelectItem>)}</SelectContent></Select>
              <Select dir={dir} onValueChange={(value: "asc" | "desc") => { setSortOrder(value); setPage(1); }} value={sortOrder}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">{t("Newest first")}</SelectItem><SelectItem value="asc">{t("Oldest first")}</SelectItem></SelectContent></Select>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("Filter by transaction reason")}>
              <TypeFilter active={type === "ALL"} count={summary?.total ?? 0} label={t("All transaction types")} lang={lang} onClick={() => { setType("ALL"); setPage(1); }} />
              {walletTransactionTypes.map((item) => <TypeFilter active={type === item} count={summary?.types[item] ?? 0} key={item} label={t(walletTypeLabels[item])} lang={lang} onClick={() => { setType(item); setPage(1); }} />)}
            </div>
          </CardHeader>
          <CardContent>
            {transactions.isLoading ? <TableSkeleton /> : null}
            {transactions.isError ? <Alert variant="destructive"><AlertTitle>{t("Wallet transaction list unavailable")}</AlertTitle><AlertDescription>{transactions.error.message}</AlertDescription></Alert> : null}
            {!transactions.isLoading && !transactions.isError && items.length ? <WalletTransactionsTable items={items} lang={lang} /> : null}
            {!transactions.isLoading && !transactions.isError && !items.length ? <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">{t("No wallet transactions match the current filters.")}</div> : null}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{t("Showing")} {items.length.toLocaleString(lang)} {t("of")} {(transactions.data?.total ?? 0).toLocaleString(lang)} {t("transactions")}.</p><div className="flex gap-2"><Button disabled={page <= 1 || transactions.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button><Button disabled={page >= (transactions.data?.totalPages ?? 1) || transactions.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button></div></div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function WalletTransactionsTable({ items, lang }: { items: AdminWalletTransaction[]; lang: string }) {
  const t = (text: string) => translateUiText(text, lang);
  return <div className="overflow-x-auto"><Table className="min-w-[1800px]"><TableHeader><TableRow><TableHead>{t("Exact transaction time")}</TableHead><TableHead>{t("User profile")}</TableHead><TableHead>{t("Credit direction")}</TableHead><TableHead>{t("Transaction reason")}</TableHead><TableHead>{t("Wallet")}</TableHead><TableHead>{t("Transaction amount")}</TableHead><TableHead>{t("Balance before")}</TableHead><TableHead>{t("Balance after transaction")}</TableHead><TableHead>{t("Reference")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead className="text-start">{t("Actions")}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="whitespace-nowrap align-top font-medium tabular-nums">{formatPlatformDate(item.createdAt, { dateStyle: "medium", timeStyle: "medium" }, lang)}</TableCell><TableCell className="min-w-52 align-top"><AdminUserLink userId={item.user.id}>{walletUserName(item.user)}</AdminUserLink><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{formatMobileDisplay(item.user.mobile) || item.user.email || "—"}</p></TableCell><TableCell className="align-top"><AdminWalletDirectionBadge direction={item.direction} t={t} /></TableCell><TableCell className="min-w-72 align-top"><Badge variant="outline">{t(walletTypeLabels[item.type])}</Badge><p className="mt-2 leading-6">{item.description}</p></TableCell><TableCell className="align-top">{t(item.wallet.currency === "TOMAN" ? "Toman wallet" : "Silver wallet")}</TableCell><TableCell className={`align-top text-base font-bold tabular-nums ${item.direction === "INCREASE" ? "text-emerald-600" : "text-destructive"}`}>{formatWalletAmount(item.amount, item.wallet.currency, lang, t)}</TableCell><TableCell className="align-top font-semibold tabular-nums">{formatWalletAmount(item.balanceBefore, item.wallet.currency, lang, t)}</TableCell><TableCell className="align-top font-semibold tabular-nums">{formatWalletAmount(item.balanceAfter, item.wallet.currency, lang, t)}</TableCell><TableCell className="max-w-52 align-top font-mono text-xs" dir="ltr">{item.reference ?? "—"}</TableCell><TableCell className="align-top"><Badge variant="secondary">{t(item.status)}</Badge></TableCell><TableCell className="align-top text-start"><div className="flex gap-2"><Button asChild size="sm"><Link href={`/admin/finance/wallet-transactions/${item.id}` as never}><Eye className="size-4" />{t("Full details")}</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/admin/users/${item.userId}/edit` as never}>{t("User profile")}</Link></Button></div></TableCell></TableRow>)}</TableBody></Table></div>;
}

function TypeFilter({ active, count, label, lang, onClick }: { active: boolean; count: number; label: string; lang: string; onClick: () => void }) {
  return <Button className="rounded-full" onClick={onClick} size="sm" variant={active ? "default" : "outline"}>{label}<Badge className="ms-1 min-w-6 justify-center" variant={active ? "secondary" : "outline"}>{count.toLocaleString(lang)}</Badge></Button>;
}

function WalletMetric({ icon: Icon, label, tone = "default", value }: { icon: typeof WalletCards; label: string; tone?: "default" | "decrease" | "increase" | "reward"; value: number }) {
  const toneClass = { default: "bg-primary/10 text-primary", decrease: "bg-rose-500/10 text-rose-700 dark:text-rose-300", increase: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", reward: "bg-violet-500/10 text-violet-700 dark:text-violet-300" }[tone];
  return <Card className="rounded-lg border-border bg-card/70"><CardContent className="flex items-center gap-4 p-5"><div className={`grid size-11 place-items-center rounded-lg ${toneClass}`}><Icon className="size-5" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value.toLocaleString("fa-IR")}</p></div></CardContent></Card>;
}

function TableSkeleton() { return <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-14" key={index} />)}</div>; }
function WalletTransactionsSkeleton() { return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-24" key={index} />)}</div><ShadowSkeleton className="h-[40rem]" /></div>; }
