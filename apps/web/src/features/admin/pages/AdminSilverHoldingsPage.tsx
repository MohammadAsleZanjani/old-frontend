"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Coins, Eye, LockKeyhole, PackageCheck, RotateCcw, Search, ShoppingCart, WalletCards } from "lucide-react";
import { useState } from "react";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { getAdminSilverHoldings, type AdminSilverHolding, type WalletUserOption } from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
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

export function AdminSilverHoldingsPage() {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const canView = Boolean(access && (access.isSuperAdmin || access.permissions.includes("silver.wallets.view")));
  const canAdjust = Boolean(access && (access.isSuperAdmin || access.permissions.includes("silver.wallets.adjust")));
  const holdings = useQuery({
    enabled: canView,
    queryFn: () => getAdminSilverHoldings({ page, pageSize: 20, search: search.trim() || undefined, sortOrder }),
    queryKey: ["admin-silver-holdings", page, search, sortOrder],
    retry: 1,
  });

  if (overview.isLoading || (canView && holdings.isLoading)) {
    return <AdminShell><HoldingsSkeleton /></AdminShell>;
  }
  if (overview.isError || holdings.isError) {
    const error = overview.error ?? holdings.error;
    return <AdminShell access={access}><Alert variant="destructive"><AlertTitle>{t("List unavailable")}</AlertTitle><AlertDescription>{error instanceof Error ? error.message : t("Something went wrong")}</AlertDescription></Alert></AdminShell>;
  }
  if (!canView) {
    return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("You do not have permission to view silver holdings.")}</AlertDescription></Alert></AdminShell>;
  }

  const data = holdings.data;
  const summary = data?.summary;
  const rows = data?.items ?? [];

  const resetFilters = () => {
    setPage(1);
    setSearch("");
    setSortOrder("desc");
  };

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2"><Badge variant="outline">{t("Silver")}</Badge>
            <div className="flex items-center gap-3"><WalletCards className="size-7 text-primary" /><h2 className="text-2xl font-bold md:text-3xl">{t("Silver holdings")}</h2></div>
            <p className="text-sm leading-7 text-muted-foreground">{t("Current available, locked, and total silver balances for every user, ordered by the exact last balance update.")}</p>
          </div>
          <AdminExcelExportButton
            disabled={holdings.isLoading || (data?.total ?? 0) === 0}
            fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminSilverHoldings({ page: exportPage, pageSize, search: search.trim() || undefined, sortOrder }))}
            filename="silver-holdings"
            sheetName={t("Silver holdings")}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <HoldingMetric icon={ShoppingCart} label={t("Silver purchased today")} meta={t("Completed silver purchases since Tehran midnight")} value={formatGrams(summary?.todayPurchasedGrams, lang)} />
          <HoldingMetric icon={Coins} label={t("Total silver purchased")} meta={t("All completed silver purchase orders")} value={formatGrams(summary?.totalPurchasedGrams, lang)} />
          <HoldingMetric icon={PackageCheck} label={t("Total silver delivered")} meta={t("All physically delivered silver")} value={formatGrams(summary?.totalDeliveredGrams, lang)} />
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><CardTitle>{t("User silver balances")}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{t("Every balance is shown separately; timestamps include hours, minutes, and seconds.")}</p></div>
              <Button disabled={!search && sortOrder === "desc"} onClick={resetFilters} size="sm" variant="outline"><RotateCcw className="size-4" />{t("Clear filters")}</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search by name, mobile, email, or certificate")} value={search} /></div>
              <Select dir={dir} onValueChange={(value: "asc" | "desc") => { setPage(1); setSortOrder(value); }} value={sortOrder}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="desc">{t("Newest balance update first")}</SelectItem><SelectItem value="asc">{t("Oldest balance update first")}</SelectItem></SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {rows.length ? (
              <Table className="min-w-[1100px]" dir={dir}>
                <TableHeader><TableRow><TableHead className="min-w-64">{t("User profile")}</TableHead><TableHead>{t("Available balance")}</TableHead><TableHead>{t("Locked balance")}</TableHead><TableHead>{t("Total silver balance")}</TableHead><TableHead className="min-w-56">{t("Exact balance update")}</TableHead><TableHead className="min-w-72 text-start">{t("Actions")}</TableHead></TableRow></TableHeader>
                <TableBody>{rows.map((holding) => <HoldingRow canAdjust={canAdjust} holding={holding} key={holding.id} lang={lang} t={t} />)}</TableBody>
              </Table>
            ) : <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">{t("No records match the current filters.")}</div>}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{t("Showing")} {rows.length.toLocaleString(lang === "fa" ? "fa-IR" : "en-US")} {t("of")} {(data?.total ?? 0).toLocaleString(lang === "fa" ? "fa-IR" : "en-US")} {t("records")}.</p>
              <div className="flex gap-2"><Button disabled={page <= 1 || holdings.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button><Button disabled={page >= (data?.totalPages ?? 1) || holdings.isFetching} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function HoldingMetric({ icon: Icon, label, meta, value }: { icon: typeof Coins; label: string; meta: string; value: string }) {
  return <Card className="rounded-lg border-border bg-card/70"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle><Icon className="size-5 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold tabular-nums">{value}</div><p className="mt-1 text-xs text-muted-foreground">{meta}</p></CardContent></Card>;
}

function HoldingRow({ canAdjust, holding, lang, t }: { canAdjust: boolean; holding: AdminSilverHolding; lang: string; t: (value: string) => string }) {
  const profileHref = `/admin/users/${encodeURIComponent(holding.userId)}/edit`;
  const transactionsHref = `/admin/finance/wallet-transactions?userId=${encodeURIComponent(holding.userId)}`;
  const adjustHref = `/admin/finance/wallet-adjustments?userId=${encodeURIComponent(holding.userId)}`;
  return (
    <TableRow>
      <TableCell className="align-top"><AdminUserLink userId={holding.userId}>{userName(holding.user)}</AdminUserLink><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{formatMobileDisplay(holding.user.mobile) || holding.user.email || holding.userId}</p></TableCell>
      <TableCell className="align-top font-semibold tabular-nums">{formatGrams(holding.availableGrams, lang)}</TableCell>
      <TableCell className="align-top"><span className="inline-flex items-center gap-1.5 font-semibold tabular-nums"><LockKeyhole className="size-4 text-muted-foreground" />{formatGrams(holding.lockedGrams, lang)}</span></TableCell>
      <TableCell className="align-top font-bold tabular-nums text-primary">{formatGrams(holding.totalGrams, lang)}</TableCell>
      <TableCell className="align-top text-sm tabular-nums">{formatPlatformDate(holding.updatedAt, { dateStyle: "medium", timeStyle: "medium" }, lang)}</TableCell>
      <TableCell className="align-top text-start"><div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={transactionsHref}><Eye className="size-4" />{t("View all transactions")}</Link></Button><Button asChild size="sm" variant="ghost"><Link href={profileHref}>{t("User profile")}</Link></Button>{canAdjust ? <Button asChild size="sm" variant="ghost"><Link href={adjustHref}>{t("Adjust balance")}</Link></Button> : null}</div></TableCell>
    </TableRow>
  );
}

function userName(user: WalletUserOption) {
  return [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.mobile || user.email || user.id;
}

function formatGrams(value: string | undefined, lang: string) {
  const number = Number(value ?? 0);
  return `${new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 3 }).format(Number.isFinite(number) ? number : 0)} ${lang === "fa" ? "گرم" : "g"}`;
}

function HoldingsSkeleton() {
  return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><ShadowSkeleton className="h-[34rem]" /></div>;
}
