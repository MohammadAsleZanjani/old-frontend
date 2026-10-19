"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Download, Eye, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminAuditLogs, type AuditLogItem } from "@/features/admin/api/admin-audit-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminAuditLogsPage() {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeRecord, setActiveRecord] = useState<AuditLogItem | null>(null);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("audit_logs.view"));
  const logs = useQuery({
    enabled: allowed,
    queryFn: () => getAdminAuditLogs({ entityType: entityType === "all" ? undefined : entityType, page, pageSize: 10, search, sortOrder }),
    queryKey: ["admin-audit-logs", entityType, page, search, sortOrder],
    retry: 1,
  });
  const items = useMemo(() => logs.data?.items ?? [], [logs.data?.items]);
  const entityTypes = useMemo(() => Array.from(new Set(["all", ...items.map((item) => item.entityType)])), [items]);
  const metrics = [
    { label: t("Events"), meta: t("Matching audit log records"), value: logs.data?.total ?? 0 },
    { label: t("Entities"), meta: t("Distinct entity types on page"), value: entityTypes.filter((item) => item !== "all").length },
    { label: t("Actors"), meta: t("Distinct actors on page"), value: new Set(items.map((item) => item.actorId).filter(Boolean)).size },
    { label: t("Selected"), meta: t("Rows ready for export"), value: selectedRows.length },
  ];

  if (overview.isLoading) return <AdminShell><AuditSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Change history unavailable")}</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription></Alert></AdminShell>;

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("System")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Audit Logs")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("Inspect permission-sensitive activity, actor IDs, affected entities, request metadata, and operational audit events.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={logs.isLoading || (logs.data?.total ?? 0) === 0}
              fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminAuditLogs({ entityType: entityType === "all" ? undefined : entityType, page: exportPage, pageSize, search, sortOrder }))}
              filename="audit-logs"
              sheetName={t("Audit Logs")}
            />
            <Button disabled={!selectedRows.length} onClick={() => downloadJson("audit-logs-selected", items.filter((item) => selectedRows.includes(item.id)), t)} variant="outline"><Download className="size-4" />{t("Export selected")}</Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={metric.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{metric.value}</div><p className="mt-1 text-xs text-muted-foreground">{metric.meta}</p></CardContent>
            </Card>
          ))}
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2"><Activity className="size-5 text-primary" />{t("Sensitive change history")}</CardTitle>
              <Button onClick={() => setShowAdvancedFilters((current) => !current)} variant="outline">{t("Advanced filters")}</Button>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px]">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder={t("Search action, entity type, or entity id")} value={search} />
              </div>
              <Select dir={dir} onValueChange={(value) => { setPage(1); setEntityType(value); }} value={entityType}>
                <SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger>
                <SelectContent>{entityTypes.map((item) => <SelectItem key={item} value={item}>{item === "all" ? t("All entities") : item}</SelectItem>)}</SelectContent>
              </Select>
              <Select dir={dir} onValueChange={(value: "asc" | "desc") => setSortOrder(value)} value={sortOrder}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="desc">{t("Newest first")}</SelectItem><SelectItem value="asc">{t("Oldest first")}</SelectItem></SelectContent>
              </Select>
            </div>
            {showAdvancedFilters ? <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 text-sm md:grid-cols-3"><Summary label={t("Entity")} value={entityType === "all" ? t("All entity types") : entityType} /><Summary label={t("Order")} value={sortOrder === "desc" ? t("Newest first") : t("Oldest first")} /><Summary label={t("Selection")} value={`${selectedRows.length} ${t("selected")}`} /></div> : null}
          </CardHeader>
          <CardContent>
            {logs.isLoading ? <TableSkeleton /> : null}
            {logs.isError ? <Alert variant="destructive"><AlertTitle>{t("Audit list unavailable")}</AlertTitle><AlertDescription>{logs.error.message}</AlertDescription></Alert> : null}
            {!logs.isLoading && !logs.isError && items.length ? <AuditTable items={items} onRecord={setActiveRecord} selectedRows={selectedRows} setSelectedRows={setSelectedRows} /> : null}
            {!logs.isLoading && !logs.isError && !items.length ? <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">{t("No audit events match the current filters.")}</div> : null}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{t("Showing")} {items.length} {t("of")} {logs.data?.total ?? 0} {t("audit events")}.</p>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || logs.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button>
                <Button disabled={page >= (logs.data?.totalPages ?? 1) || logs.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <RecordDialog record={activeRecord} onOpenChange={(open) => !open && setActiveRecord(null)} />
    </AdminShell>
  );
}

function AuditTable(props: { items: AuditLogItem[]; onRecord: (record: AuditLogItem) => void; selectedRows: string[]; setSelectedRows: (rows: string[]) => void }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const allSelected = props.items.length > 0 && props.items.every((item) => props.selectedRows.includes(item.id));
  return (
    <Table>
      <TableHeader><TableRow><TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={(checked) => props.setSelectedRows(checked ? props.items.map((item) => item.id) : [])} /></TableHead><TableHead>{t("Event")}</TableHead><TableHead>{t("Entity")}</TableHead><TableHead>{t("Actor")}</TableHead><TableHead>{t("Created")}</TableHead><TableHead className="text-start">{t("Actions")}</TableHead></TableRow></TableHeader>
      <TableBody>{props.items.map((item) => <TableRow key={item.id}><TableCell><Checkbox checked={props.selectedRows.includes(item.id)} onCheckedChange={(checked) => props.setSelectedRows(checked ? [...props.selectedRows, item.id] : props.selectedRows.filter((id) => id !== item.id))} /></TableCell><TableCell><div className="space-y-1"><p className="font-semibold">{item.action}</p><p className="line-clamp-1 text-xs text-muted-foreground">{metadataPreview(item.metadata, t)}</p></div></TableCell><TableCell><div className="space-y-1"><Badge variant="outline">{t(item.entityType)}</Badge><p className="text-xs text-muted-foreground">{item.entityId ?? t("No entity id")}</p></div></TableCell><TableCell className="text-sm text-muted-foreground">{item.actorId ?? t("System")}</TableCell><TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell><TableCell className="text-start"><Button onClick={() => props.onRecord(item)} size="sm" variant="outline"><Eye className="size-4" />{t("View")}</Button></TableCell></TableRow>)}</TableBody>
    </Table>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><p className="font-medium">{label}</p><p className="mt-1 text-muted-foreground">{value}</p></div>;
}

function RecordDialog(props: { onOpenChange: (open: boolean) => void; record: AuditLogItem | null }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return <Dialog onOpenChange={props.onOpenChange} open={!!props.record}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{t("Audit event")}</DialogTitle><DialogDescription>{t("Full audit payload for security and operational inspection.")}</DialogDescription></DialogHeader><pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-6">{JSON.stringify(props.record, null, 2)}</pre></DialogContent></Dialog>;
}

function metadataPreview(value: unknown, t: (text: string) => string) {
  if (!value) return t("No metadata");
  return JSON.stringify(value);
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function downloadJson(label: string, items: unknown[], t: (text: string) => string) {
  if (typeof window === "undefined" || !items.length) return;
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${label}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success(t("Audit export downloaded."));
}

function TableSkeleton() {
  return <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-12" key={index} />)}</div>;
}

function AuditSkeleton() {
  return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><ShadowSkeleton className="h-[36rem]" /></div>;
}
