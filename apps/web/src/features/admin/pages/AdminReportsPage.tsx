"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowDownUp, Eye, Search, UserRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  getAdminActivityReport,
  reportOperations,
  type AdminReportActivity,
  type ReportOperation,
} from "@/features/admin/api/admin-reports-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
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

const operationLabels: Record<ReportOperation, string> = {
  KYC: "Identity verification",
  PRODUCT_PURCHASE: "Physical product purchase",
  REGISTRATION: "User registration",
  SILVER_BUY: "Molten silver purchase",
  SILVER_SELL: "Molten silver sale",
  TOMAN_WITHDRAWAL: "Toman withdrawal request",
  WALLET_TOP_UP: "Wallet top-up",
};

const operationClasses: Record<ReportOperation, string> = {
  KYC: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  PRODUCT_PURCHASE: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  REGISTRATION: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  SILVER_BUY: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  SILVER_SELL: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  TOMAN_WITHDRAWAL: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  WALLET_TOP_UP: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
};

export function AdminReportsPage() {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [operation, setOperation] = useState<"ALL" | ReportOperation>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = hasAdminPermission(access, "reports.activity.view");
  const canExport = hasAdminPermission(access, "reports.activity.export");
  const report = useQuery({
    enabled: allowed,
    queryFn: () => getAdminActivityReport({ operation: operation === "ALL" ? undefined : operation, page, pageSize: 20, search: deferredSearch || undefined, sortOrder }),
    queryKey: ["admin-activity-report", deferredSearch, operation, page, sortOrder],
    retry: 1,
  });
  const items = useMemo(() => report.data?.items ?? [], [report.data?.items]);
  const byOperation = report.data?.summary.byOperation;
  const silverTrades = (byOperation?.SILVER_BUY ?? 0) + (byOperation?.SILVER_SELL ?? 0);
  const financialRequests = (byOperation?.WALLET_TOP_UP ?? 0) + (byOperation?.TOMAN_WITHDRAWAL ?? 0);

  if (overview.isLoading) return <AdminShell><ReportsSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Reports unavailable")}</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription></Alert></AdminShell>;

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Management")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Unified user activity report")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("Registration, identity verification, silver trades, physical product purchases, wallet top-ups, and Toman withdrawal requests in one exact timeline.")}</p>
          </div>
          {canExport ? <AdminExcelExportButton
            disabled={report.isLoading || (report.data?.total ?? 0) === 0}
            fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminActivityReport({ operation: operation === "ALL" ? undefined : operation, page: exportPage, pageSize, search: deferredSearch || undefined, sortOrder }))}
            filename="user-activity-report"
            sheetName={t("Unified user activity report")}
          /> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <ReportMetric icon={Activity} label={t("All activities")} value={report.data?.summary.total ?? 0} />
          <ReportMetric icon={UserRound} label={t("Registrations and KYC")} value={(byOperation?.REGISTRATION ?? 0) + (byOperation?.KYC ?? 0)} />
          <ReportMetric icon={ArrowDownUp} label={t("Silver trades")} value={silverTrades} />
          <ReportMetric icon={WalletCards} label={t("Financial requests")} value={financialRequests} />
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2"><Activity className="size-5 text-primary" />{t("User activity timeline")}</CardTitle>
              <div className="grid gap-3 sm:grid-cols-[minmax(260px,1fr)_170px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search user, mobile, reference, or order number")} value={search} />
                </div>
                <Select dir={dir} onValueChange={(value: "asc" | "desc") => { setPage(1); setSortOrder(value); }} value={sortOrder}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="desc">{t("Newest first")}</SelectItem><SelectItem value="asc">{t("Oldest first")}</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("Filter by operation type")}>
              <OperationFilter active={operation === "ALL"} count={report.data?.summary.total ?? 0} label={t("All operations")} onClick={() => { setOperation("ALL"); setPage(1); }} />
              {reportOperations.map((item) => (
                <OperationFilter active={operation === item} count={byOperation?.[item] ?? 0} key={item} label={t(operationLabels[item])} onClick={() => { setOperation(item); setPage(1); }} />
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {report.isLoading ? <TableSkeleton /> : null}
            {report.isError ? <Alert variant="destructive"><AlertTitle>{t("Report list unavailable")}</AlertTitle><AlertDescription>{report.error.message}</AlertDescription></Alert> : null}
            {!report.isLoading && !report.isError && items.length ? <ActivityTable items={items} lang={lang} /> : null}
            {!report.isLoading && !report.isError && !items.length ? <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">{t("No activities match the current filters.")}</div> : null}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{t("Showing")} {items.length.toLocaleString(lang)} {t("of")} {(report.data?.total ?? 0).toLocaleString(lang)} {t("activities")}.</p>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || report.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button>
                <Button disabled={page >= (report.data?.totalPages ?? 1) || report.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function ActivityTable({ items, lang }: { items: AdminReportActivity[]; lang: string }) {
  const t = (text: string) => translateUiText(text, lang);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>{t("Exact update time")}</TableHead><TableHead>{t("User first and last name")}</TableHead><TableHead>{t("Operation type")}</TableHead><TableHead>{t("Operation details")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead className="text-start">{t("Actions")}</TableHead></TableRow></TableHeader>
        <TableBody>{items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="whitespace-nowrap align-top font-medium tabular-nums">{formatPlatformDate(item.occurredAt, { dateStyle: "medium", timeStyle: "medium" }, lang)}</TableCell>
            <TableCell className="min-w-48 align-top"><AdminUserLink userId={item.user.id}>{item.user.fullName}</AdminUserLink><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{formatMobileDisplay(item.user.mobile) || item.user.email || "—"}</p></TableCell>
            <TableCell className="align-top"><Badge className={operationClasses[item.operation]} variant="outline">{t(operationLabels[item.operation])}</Badge></TableCell>
            <TableCell className="min-w-64 align-top"><p className="font-semibold">{t(item.title)}</p>{item.reference ? <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{item.reference}</p> : null}<p className="mt-1 text-xs leading-6 text-muted-foreground">{activityDetails(item, lang, t)}</p></TableCell>
            <TableCell className="align-top"><Badge variant="secondary">{t(item.status)}</Badge></TableCell>
            <TableCell className="align-top text-start"><Button asChild size="sm" variant="outline"><Link href={item.detailsHref as never}><Eye className="size-4" />{t("View details")}</Link></Button></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </div>
  );
}

function OperationFilter({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return <Button className="rounded-full" onClick={onClick} size="sm" variant={active ? "default" : "outline"}>{label}<Badge className="ms-1 min-w-6 justify-center" variant={active ? "secondary" : "outline"}>{count.toLocaleString("fa-IR")}</Badge></Button>;
}

function ReportMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: number }) {
  return <Card className="rounded-lg border-border bg-card/70"><CardContent className="flex items-center gap-4 p-5"><div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value.toLocaleString("fa-IR")}</p></div></CardContent></Card>;
}

function activityDetails(item: AdminReportActivity, lang: string, t: (text: string) => string) {
  const parts: string[] = [];
  if (item.grams) parts.push(`${Number(item.grams).toLocaleString(lang, { maximumFractionDigits: 3 })} ${t("grams")}`);
  if (item.quantity) parts.push(`${item.quantity.toLocaleString(lang)} ${t("items")}`);
  if (item.amountToman) parts.push(`${Number(item.amountToman).toLocaleString(lang)} ${t("Toman")}`);
  if (item.netToman) parts.push(`${t("Net amount")}: ${Number(item.netToman).toLocaleString(lang)} ${t("Toman")}`);
  if (item.feeToman && Number(item.feeToman) > 0) parts.push(`${t("Fee")}: ${Number(item.feeToman).toLocaleString(lang)} ${t("Toman")}`);
  if (item.description) parts.push(t(item.description));
  return parts.join(" · ") || t("No additional details");
}

function downloadReport(items: AdminReportActivity[]) {
  if (typeof window === "undefined" || !items.length) return;
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "user-activity-report.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function TableSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-14" key={index} />)}</div>;
}

function ReportsSkeleton() {
  return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-24" key={index} />)}</div><ShadowSkeleton className="h-[38rem]" /></div>;
}
