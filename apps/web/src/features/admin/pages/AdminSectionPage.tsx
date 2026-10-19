"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CircleDollarSign, ClipboardCheck, Download, Eye, Filter, Loader2, MessageSquareReply, MoreHorizontal, Pencil, Plus, Printer, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "@/shared/ui/sonner";

import { downloadAdminInvoicePdf, getAdminOverview, getAdminResourceList, printAdminInvoicePdf, saveAdminQuickResource, updateAdminQuickResource } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { findAdminItem } from "@/features/admin/config/admin-navigation";
import { findAdminResourceDefinition } from "@/features/admin/config/admin-resources";
import { buildAdminResourceMetrics, buildOverviewRows, normalizeAdminResourceRow, type AdminResourceRow } from "@/features/admin/lib/admin-resource-presenter";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

export function AdminSectionPage({ initialSearch, initialUserId }: { initialSearch?: string; initialUserId?: string }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const item = findAdminItem(pathname);
  const resource = findAdminResourceDefinition(pathname);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [status, setStatus] = useState("all");
  const [orderType, setOrderType] = useState("all");
  const [gateway, setGateway] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showOwnerColumn, setShowOwnerColumn] = useState(true);
  const [showUpdatedColumn, setShowUpdatedColumn] = useState(true);
  const [quickEditorOpen, setQuickEditorOpen] = useState(false);
  const [quickEditorRow, setQuickEditorRow] = useState<AdminQuickRow>();
  const [quickForm, setQuickForm] = useState<QuickForm>(() => createEmptyQuickForm());
  const [workflowRow, setWorkflowRow] = useState<AdminQuickRow>();
  const [workflowForm, setWorkflowForm] = useState<WorkflowForm>({ status: "" });
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const data = overview.data;
  const access = data?.access;
  const allowed = !!access && (!item.permission || access.isSuperAdmin || access.permissions.includes(item.permission));
  const quickEditor = getQuickEditorConfig(pathname);
  const workflow = getWorkflowConfig(pathname);
  const quickAllowed = !!access && !!quickEditor && (access.isSuperAdmin || access.permissions.includes(quickEditor.permission));
  const workflowAllowed = !!access && !!workflow && (access.isSuperAdmin || access.permissions.includes(workflow.permission));
  const adjustAllowed = !!access && (access.isSuperAdmin || access.permissions.includes("silver.wallets.adjust"));
  const isLiveChatList = pathname === "/admin/support/live-chat";
  const isPaymentList = pathname === "/admin/finance/payments" || pathname === "/admin/finance/payments/transactions";
  const isSilverOrderList = pathname === "/admin/silver/orders";
  const isProductOrderList = pathname.startsWith("/admin/shop/orders");
  const isWalletTransactionList = pathname === "/admin/finance/wallet-transactions";
  const resourceFilters = {
    dateFrom: isLiveChatList ? dateFrom || undefined : undefined,
    dateTo: isLiveChatList ? dateTo || undefined : undefined,
    gateway: isPaymentList && gateway !== "all" ? gateway : undefined,
    paymentMethod: isProductOrderList && paymentMethod !== "all" ? paymentMethod : undefined,
    search,
    sortOrder,
    status: status !== "all" && resource?.statuses?.includes(status) ? status : resource?.defaultStatus,
    type: isSilverOrderList && orderType !== "all" ? orderType : undefined,
    userId: initialUserId,
  };
  const resourceQuery = useQuery({
    enabled: !!data && allowed && !!resource,
    queryFn: () =>
      getAdminResourceList(resource?.endpoint ?? "", { ...resourceFilters, page, pageSize: 10 }),
    queryKey: ["admin-resource", resource?.endpoint, page, search, sortOrder, status, orderType, gateway, paymentMethod, dateFrom, dateTo, initialUserId],
    retry: 1,
  });
  const rows = useMemo(
    () => resourceQuery.data?.items?.map((record) => normalizeAdminResourceRow(record)) ?? buildOverviewRows(item.label, data?.recentActivity ?? []),
    [data?.recentActivity, item.label, resourceQuery.data?.items],
  );
  const isInvoiceList = pathname === "/admin/finance/invoices" || pathname === "/admin/finance/invoices/drafts";
  const total = resourceQuery.data?.total ?? rows.length;
  const totalPages = resourceQuery.data?.totalPages ?? 1;
  const metrics = buildAdminResourceMetrics(rows, total);
  const createHref = getCreateHref(pathname);
  const saveQuickResource = useMutation({
    mutationFn: () => {
      if (!quickEditor) throw new Error(t("This action is unavailable."));
      return saveAdminQuickResource(quickEditor.endpoint, buildQuickPayload(quickEditor.kind, quickForm));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Save failed")),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-resource", resource?.endpoint] });
      toast.success(t(quickEditorRow ? "Changes saved." : "Record created."));
      setQuickEditorOpen(false);
      setQuickEditorRow(undefined);
      setQuickForm(createEmptyQuickForm());
    },
  });
  const saveWorkflow = useMutation({
    mutationFn: () => {
      if (!workflow || !workflowRow) throw new Error(t("This action is unavailable."));
      return updateAdminQuickResource(`${workflow.endpoint}/${workflowRow.id}`, buildWorkflowPayload(workflow.kind, workflowForm));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Update failed")),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-resource", resource?.endpoint] });
      toast.success(t("Changes saved."));
      setWorkflowRow(undefined);
      setWorkflowForm({ status: "" });
    },
  });

  function openQuickEditor(row?: AdminQuickRow) {
    setQuickEditorRow(row);
    setQuickForm(row ? quickFormFromRow(row) : createEmptyQuickForm());
    setQuickEditorOpen(true);
  }

  function openWorkflow(row: AdminQuickRow) {
    setWorkflowRow(row);
    setWorkflowForm({ status: workflow?.kind === "kyc" ? (row.status === "REJECTED" ? "REJECTED" : "APPROVED") : row.status });
  }
  const invoicePdf = useMutation({
    mutationFn: (invoiceId: string) => downloadAdminInvoicePdf(invoiceId),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Invoice PDF download failed")),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("Invoice PDF is ready."));
    },
  });
  const invoicePrint = useMutation({
    mutationFn: (invoiceId: string) => printAdminInvoicePdf(invoiceId),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Invoice print failed")),
    onSuccess: () => toast.success(t("Print dialog opened.")),
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <SectionSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Admin page unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell>
        <SectionSkeleton />
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">
              {t(item.group)}
            </Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t(item.label)}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t(item.description)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {resource ? (
              <AdminExcelExportButton
                disabled={!allowed || resourceQuery.isLoading || total === 0}
                fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminResourceList(resource.endpoint, { ...resourceFilters, page: exportPage, pageSize }))}
                filename={item.label}
                sheetName={t(item.label)}
              />
            ) : null}
            {createHref ? (
              <Button asChild disabled={!allowed}>
                <Link href={createHref}>
                  <Plus className="size-4" />
                  {t(item.primaryAction ?? "Create")}
                </Link>
              </Button>
            ) : quickEditor ? (
              <Button disabled={!quickAllowed} onClick={() => openQuickEditor()}>
                <Plus className="size-4" />
                {t(quickEditor.createLabel)}
              </Button>
            ) : null}
          </div>
        </section>

        {!allowed ? (
          <Alert>
            <AlertTitle>{t("Permission required")}</AlertTitle>
            <AlertDescription>{t("Your current role can view this page, but cannot make changes.")}</AlertDescription>
          </Alert>
        ) : null}

        {initialUserId ? (
          <Alert>
            <AlertTitle>{t("Selected user records")}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{t("This list is limited to records belonging to the selected user.")}</span>
              <Button asChild size="sm" variant="outline"><Link href={pathname as never}>{t("Show all users")}</Link></Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map(({ label, value, meta }) => (
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>{t(item.label)} {t("records")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!allowed || !selectedRows.length}
                  onClick={() => downloadRowsCsv(`${t(item.label)}-${t("selected")}`, rows.filter((row) => selectedRows.includes(row.id)), t)}
                  size="sm"
                  variant="outline"
                >
                  {t("Export selected")}
                </Button>
                {!isInvoiceList && !isPaymentList && !isSilverOrderList && !isProductOrderList ? (
                  <Button
                    onClick={() => {
                      setShowOwnerColumn((current) => !current);
                      setShowUpdatedColumn((current) => !current);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <SlidersHorizontal className="size-4" />
                    {t("Columns")}
                  </Button>
                ) : null}
                <Button
                  disabled={!search && status === "all" && orderType === "all" && gateway === "all" && paymentMethod === "all" && sortOrder === "desc" && !dateFrom && !dateTo}
                  onClick={() => {
                    setPage(1);
                    setSearch("");
                    setStatus("all");
                    setOrderType("all");
                    setGateway("all");
                    setPaymentMethod("all");
                    setSortOrder("desc");
                    setDateFrom("");
                    setDateTo("");
                    setSelectedRows([]);
                  }}
                  size="sm"
                  variant="outline"
                >
                  {t("Clear filters")}
                </Button>
              </div>
            </div>
            <div className={isPaymentList || isSilverOrderList || isProductOrderList ? "grid gap-3 lg:grid-cols-[1fr_180px_180px_180px_180px]" : "grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]"}>
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder={t(isLiveChatList ? "Search by subject, chat number, or customer" : isPaymentList ? "Search by payment number, reference, or customer email" : isSilverOrderList || isProductOrderList ? "Search by order number, name, mobile, or email" : "Search by title, status, customer, or reference")}
                  value={search}
                />
              </div>
              <Select
                dir={dir}
                disabled={!resource?.statuses?.length}
                onValueChange={(value) => {
                  setPage(1);
                  setStatus(value);
                }}
                value={resource?.statuses?.includes(status) ? status : "all"}
              >
                <SelectTrigger>
                  <Filter className="size-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All statuses")}</SelectItem>
                  {(resource?.statuses ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(option.replaceAll("_", " "))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSilverOrderList ? (
                <Select dir={dir} onValueChange={(value) => { setPage(1); setOrderType(value); }} value={orderType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All order types")}</SelectItem>
                    <SelectItem value="BUY">{t("Buy silver")}</SelectItem>
                    <SelectItem value="SELL">{t("Sell silver")}</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {isPaymentList ? (
                <Select dir={dir} onValueChange={(value) => { setPage(1); setGateway(value); }} value={gateway}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All gateways")}</SelectItem>
                    <SelectItem value="zarinpal">{t("Zarinpal")}</SelectItem>
                    <SelectItem value="wallet">{t("Toman wallet")}</SelectItem>
                    <SelectItem value="silver-wallet">{t("Silver wallet")}</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {isProductOrderList ? (
                <Select dir={dir} onValueChange={(value) => { setPage(1); setPaymentMethod(value); }} value={paymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All payment methods")}</SelectItem>
                    <SelectItem value="gateway">{t("Online gateway")}</SelectItem>
                    <SelectItem value="wallet">{t("Toman wallet / shopping credit")}</SelectItem>
                    <SelectItem value="silver-wallet">{t("Silver wallet")}</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              <Select dir={dir} onValueChange={(value: "asc" | "desc") => setSortOrder(value)} value={sortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("Newest first")}</SelectItem>
                  <SelectItem value="asc">{t("Oldest first")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAdvancedFilters((current) => !current)} variant="outline">{t("Advanced filters")}</Button>
            </div>
            {showAdvancedFilters ? (
              <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 text-sm md:grid-cols-3 xl:grid-cols-4">
                {isLiveChatList ? (
                  <>
                    <label className="space-y-1.5">
                      <span className="font-medium">{t("Date from")}</span>
                      <Input onChange={(event) => { setPage(1); setDateFrom(event.target.value); }} type="date" value={dateFrom} />
                    </label>
                    <label className="space-y-1.5">
                      <span className="font-medium">{t("Date to")}</span>
                      <Input onChange={(event) => { setPage(1); setDateTo(event.target.value); }} type="date" value={dateTo} />
                    </label>
                  </>
                ) : null}
                <div>
                  <p className="font-medium">{t("Status scope")}</p>
                  <p className="mt-1 text-muted-foreground">{status === "all" ? t("All available statuses") : t(status.replaceAll("_", " "))}</p>
                </div>
                <div>
                  <p className="font-medium">{t("Ordering")}</p>
                  <p className="mt-1 text-muted-foreground">{sortOrder === "desc" ? t("Newest records first") : t("Oldest records first")}</p>
                </div>
                {isPaymentList ? <div><p className="font-medium">{t("Gateway")}</p><p className="mt-1 text-muted-foreground">{gateway === "all" ? t("All gateways") : paymentGatewayLabel(gateway, t)}</p></div> : null}
                {isProductOrderList ? <div><p className="font-medium">{t("Payment method")}</p><p className="mt-1 text-muted-foreground">{productOrderPaymentMethodLabel(paymentMethod, t)}</p></div> : null}
                {isSilverOrderList ? <div><p className="font-medium">{t("Order type")}</p><p className="mt-1 text-muted-foreground">{orderType === "all" ? t("All order types") : t(orderType === "BUY" ? "Buy silver" : "Sell silver")}</p></div> : null}
                <div>
                  <p className="font-medium">{t("Selection")}</p>
                  <p className="mt-1 text-muted-foreground">{selectedRows.length} {t("selected for export")}</p>
                </div>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {resourceQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ShadowSkeleton className="h-12" key={index} />
                ))}
              </div>
            ) : resourceQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>{t("List unavailable")}</AlertTitle>
                <AlertDescription>{resourceQuery.error.message}</AlertDescription>
              </Alert>
            ) : rows.length ? (
              isSilverOrderList ? (
              <Table className="min-w-[2200px]" dir={dir}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t("Select")}</TableHead>
                    <TableHead className="min-w-56">{t("Silver order")}</TableHead>
                    <TableHead className="min-w-60">{t("User profile")}</TableHead>
                    <TableHead className="min-w-36">{t("Order type")}</TableHead>
                    <TableHead className="min-w-44">{t("Payment method")}</TableHead>
                    <TableHead className="min-w-32">{t("Silver weight")}</TableHead>
                    <TableHead className="min-w-44">{t("Price per gram at transaction")}</TableHead>
                    <TableHead className="min-w-40">{t("Gross amount")}</TableHead>
                    <TableHead className="min-w-36">{t("Total fee")}</TableHead>
                    <TableHead className="min-w-40">{t("Final order total")}</TableHead>
                    <TableHead className="min-w-36">{t("Status")}</TableHead>
                    <TableHead className="min-w-60">{t("Exact transaction time")}</TableHead>
                    <TableHead className="min-w-60">{t("Transaction reference")}</TableHead>
                    <TableHead className="sticky end-0 min-w-28 bg-card text-start">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.id}-${row.label}-${row.at}`}>
                      <TableCell><Checkbox aria-label={`${t("Select")} ${row.label}`} checked={selectedRows.includes(row.id)} onCheckedChange={(checked) => setSelectedRows((current) => checked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id))} /></TableCell>
                      <TableCell className="align-top">
                        <Link className="font-semibold hover:text-primary" href={`/admin/silver/orders/${row.id}` as never}>{row.label}</Link>
                        <p className="mt-1 max-w-52 truncate font-mono text-[11px] text-muted-foreground" dir="ltr" title={row.id}>{row.id}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        <AdminUserLink userId={row.userId}>{row.customer}</AdminUserLink>
                        {row.mobile ? <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{row.mobile}</p> : null}
                        {row.customerEmail ? <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground" dir="ltr" title={row.customerEmail}>{row.customerEmail}</p> : null}
                      </TableCell>
                      <TableCell className="align-top"><Badge variant={row.type === "SELL" ? "secondary" : "default"}>{t(row.type === "SELL" ? "Sell silver" : "Buy silver")}</Badge></TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline">{t(row.paymentMethod === "GATEWAY" ? "Bank gateway" : row.paymentMethod === "WALLET" ? "Toman wallet" : "Not provided")}</Badge>
                        {row.gateway ? <p className="mt-2 text-xs text-muted-foreground">{paymentGatewayLabel(row.gateway, t)}</p> : null}
                      </TableCell>
                      <TableCell className="align-top font-semibold tabular-nums">{row.grams ? `${formatSilverNumber(row.grams)} ${t("gram")}` : "—"}</TableCell>
                      <TableCell className="align-top font-semibold tabular-nums">{row.pricePerGram ?? "—"}</TableCell>
                      <TableCell className="align-top tabular-nums">{row.grossAmount ?? "—"}</TableCell>
                      <TableCell className="align-top tabular-nums">{row.feeAmount ?? "—"}</TableCell>
                      <TableCell className="align-top font-bold tabular-nums">{row.total ?? "—"}</TableCell>
                      <TableCell className="align-top"><Badge variant={silverOrderStatusVariant(row.status)}>{t(row.status)}</Badge></TableCell>
                      <TableCell className="align-top text-xs">
                        <p><span className="text-muted-foreground">{t(row.completedAt ? "Transaction" : "Created")}:</span> {formatPlatformDate(row.transactionAt ?? row.completedAt ?? row.createdAt ?? row.at, { dateStyle: "medium", timeStyle: "medium" })}</p>
                        {row.completedAt && row.createdAt ? <p className="mt-1.5"><span className="text-muted-foreground">{t("Created")}:</span> {formatPlatformDate(row.createdAt, { dateStyle: "medium", timeStyle: "medium" })}</p> : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <PaymentReference label={t("Payment")} value={row.paymentNumber} />
                        <PaymentReference label={t("Reference")} value={row.transactionReference ?? row.referenceId ?? row.transactionId} />
                        <PaymentReference label={t("Invoice")} value={row.invoiceNumber} />
                      </TableCell>
                      <TableCell className="sticky end-0 bg-card/95 align-top backdrop-blur">
                        <Button asChild size="sm" variant="outline"><Link href={`/admin/silver/orders/${row.id}` as never}><Eye className="size-4" />{t("View")}</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              ) : isProductOrderList ? (
              <Table className="min-w-[1780px]" dir={dir}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t("Select")}</TableHead>
                    <TableHead className="min-w-56">{t("Order")}</TableHead>
                    <TableHead className="min-w-64">{t("Name and last name")}</TableHead>
                    <TableHead className="min-w-44">{t("Transaction type")}</TableHead>
                    <TableHead className="min-w-28">{t("Items")}</TableHead>
                    <TableHead className="min-w-44">{t("Transaction amount")}</TableHead>
                    <TableHead className="min-w-48">{t("Payment method")}</TableHead>
                    <TableHead className="min-w-40">{t("Order status")}</TableHead>
                    <TableHead className="min-w-64">{t("Exact transaction time")}</TableHead>
                    <TableHead className="sticky end-0 min-w-28 bg-card text-start">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.id}-${row.label}-${row.at}`}>
                      <TableCell><Checkbox aria-label={`${t("Select")} ${row.label}`} checked={selectedRows.includes(row.id)} onCheckedChange={(checked) => setSelectedRows((current) => checked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id))} /></TableCell>
                      <TableCell className="align-top">
                        <Link className="font-semibold hover:text-primary" href={`/admin/shop/orders/${row.id}` as never}>{row.orderNumber ?? row.label}</Link>
                        <p className="mt-1 max-w-52 truncate font-mono text-[11px] text-muted-foreground" dir="ltr" title={row.id}>{row.id}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        <AdminUserLink userId={row.userId}>{row.customer}</AdminUserLink>
                        {row.mobile ? <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{row.mobile}</p> : null}
                        {row.customerEmail ? <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground" dir="ltr" title={row.customerEmail}>{row.customerEmail}</p> : null}
                      </TableCell>
                      <TableCell className="align-top"><Badge variant="secondary">{t("Physical product purchase")}</Badge></TableCell>
                      <TableCell className="align-top font-semibold tabular-nums">{row.itemsCount ?? "—"}</TableCell>
                      <TableCell className="align-top font-bold tabular-nums" dir="ltr">{row.total ?? "—"}</TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline">{paymentGatewayLabel(row.gateway ?? row.paymentMethod, t)}</Badge>
                        {row.paymentStatus ? <p className="mt-2 text-xs text-muted-foreground">{t(row.paymentStatus)}</p> : <p className="mt-2 text-xs text-muted-foreground">{t("No payment recorded")}</p>}
                        {row.paymentNumber ? <p className="mt-1 max-w-44 truncate font-mono text-[11px] text-muted-foreground" dir="ltr" title={row.paymentNumber}>{row.paymentNumber}</p> : null}
                      </TableCell>
                      <TableCell className="align-top"><Badge variant={silverOrderStatusVariant(row.status)}>{t(row.status)}</Badge></TableCell>
                      <TableCell className="align-top text-sm tabular-nums">
                        <p>{formatPlatformDate(row.transactionAt ?? row.paidAt ?? row.createdAt ?? row.at, { dateStyle: "medium", timeStyle: "medium" })}</p>
                        {row.createdAt && row.transactionAt && row.transactionAt !== row.createdAt ? <p className="mt-1.5 text-xs text-muted-foreground">{t("Created")}: {formatPlatformDate(row.createdAt, { dateStyle: "medium", timeStyle: "medium" })}</p> : null}
                      </TableCell>
                      <TableCell className="sticky end-0 bg-card/95 align-top backdrop-blur">
                        <Button asChild size="sm" variant="outline"><Link href={`/admin/shop/orders/${row.id}` as never}><Eye className="size-4" />{t("View")}</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              ) : isInvoiceList ? (
              <Table dir={dir}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t("Select")}</TableHead>
                    <TableHead>{t("Invoice")}</TableHead>
                    <TableHead>{t("Name and last name")}</TableHead>
                    <TableHead>{t("Mobile")}</TableHead>
                    <TableHead>{t("Total price")}</TableHead>
                    <TableHead>{t("Balance due")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Updated")}</TableHead>
                    <TableHead className="text-start">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const actions = getRowActions(pathname, row);
                    return (
                      <TableRow key={`${row.id}-${row.label}-${row.at}`}>
                        <TableCell>
                          <Checkbox
                            aria-label={`${t("Select")} ${row.label}`}
                            checked={selectedRows.includes(row.id)}
                            onCheckedChange={(checked) => {
                              setSelectedRows((current) =>
                                checked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id),
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link className="hover:text-primary" href={`/admin/finance/invoices/${row.id}` as never}>{row.label}</Link>
                          {row.customerEmail ? <p className="mt-1 text-xs font-normal text-muted-foreground">{row.customerEmail}</p> : null}
                        </TableCell>
                        <TableCell><AdminUserLink userId={row.userId}>{row.customer}</AdminUserLink></TableCell>
                        <TableCell>{row.mobile ?? t("Not provided")}</TableCell>
                        <TableCell className="font-semibold">{row.total ?? "0"}</TableCell>
                        <TableCell>{row.balanceDue ?? "0"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t(row.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatPlatformDate(row.at, { dateStyle: "medium" })}</TableCell>
                        <TableCell className="text-start">
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" aria-label={t("Row actions")}>
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions.view ? (
                                  <DropdownMenuItem asChild disabled={!allowed}>
                                    <a href={actions.view}>
                                      <Eye className="size-4" />
                                      {t("View")}
                                    </a>
                                  </DropdownMenuItem>
                                ) : null}
                                {actions.invoicePrint ? (
                                  <DropdownMenuItem disabled={!allowed || invoicePrint.isPending} onClick={() => invoicePrint.mutate(row.id)}>
                                    {invoicePrint.isPending ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                                    {t("Print")}
                                  </DropdownMenuItem>
                                ) : null}
                                {actions.invoicePdf ? (
                                  <DropdownMenuItem disabled={!allowed || invoicePdf.isPending} onClick={() => invoicePdf.mutate(row.id)}>
                                    {invoicePdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                                    {t("Download PDF")}
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              ) : isPaymentList ? (
              <Table className="min-w-[1700px]" dir={dir}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t("Select")}</TableHead>
                    <TableHead className="min-w-52">{t("Payment")}</TableHead>
                    <TableHead className="min-w-56">{t("Customer")}</TableHead>
                    <TableHead className="min-w-40">{t("Amount")}</TableHead>
                    <TableHead className="min-w-44">{t("Gateway & card")}</TableHead>
                    <TableHead className="min-w-52">{t("Order / Invoice")}</TableHead>
                    <TableHead className="min-w-56">{t("Provider references")}</TableHead>
                    <TableHead className="min-w-52">{t("Status")}</TableHead>
                    <TableHead className="min-w-44">{t("Timeline")}</TableHead>
                    <TableHead className="sticky end-0 min-w-28 bg-card text-start">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.id}-${row.label}-${row.at}`}>
                      <TableCell><Checkbox aria-label={`${t("Select")} ${row.label}`} checked={selectedRows.includes(row.id)} onCheckedChange={(checked) => setSelectedRows((current) => checked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id))} /></TableCell>
                      <TableCell className="align-top">
                        <Link className="font-semibold hover:text-primary" href={`/admin/finance/payments/${row.id}` as never}>{row.label}</Link>
                        <p className="mt-1 max-w-48 truncate font-mono text-[11px] text-muted-foreground" dir="ltr" title={row.id}>{row.id}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        <AdminUserLink userId={row.userId}>{row.customer}</AdminUserLink>
                        {row.customerEmail ? <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground" dir="ltr" title={row.customerEmail}>{row.customerEmail}</p> : null}
                        {row.mobile ? <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{row.mobile}</p> : null}
                      </TableCell>
                      <TableCell className="align-top font-bold tabular-nums" dir="ltr">{row.total ?? "—"}</TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline">{paymentGatewayLabel(row.gateway, t)}</Badge>
                        {row.cardPan ? <p className="mt-2 font-mono text-xs text-muted-foreground" dir="ltr">{row.cardPan}</p> : <p className="mt-2 text-xs text-muted-foreground">{t("No card recorded")}</p>}
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        {row.orderId ? <p><span className="text-muted-foreground">{t("Order")}:</span> <Link className="font-medium hover:text-primary" href={`/admin/shop/orders/${row.orderId}` as never}>{row.orderNumber ?? row.orderId}</Link></p> : null}
                        {row.invoiceId ? <p className="mt-1.5"><span className="text-muted-foreground">{t("Invoice")}:</span> <Link className="font-medium hover:text-primary" href={`/admin/finance/invoices/${row.invoiceId}` as never}>{row.invoiceNumber ?? row.invoiceId}</Link></p> : null}
                        {!row.orderId && !row.invoiceId ? <span className="text-muted-foreground">{t("No linked order or invoice")}</span> : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <PaymentReference label={t("Reference")} value={row.referenceId} />
                        <PaymentReference label={t("Transaction")} value={row.transactionId} />
                        <PaymentReference label={t("Authority")} value={row.authority} />
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap items-center gap-1.5"><Badge variant={paymentStatusVariant(row.status)}>{t(row.status)}</Badge>{row.refundsCount ? <Badge variant="outline">{row.refundsCount} {t("refunds")}</Badge> : null}</div>
                        {row.failureReason ? <p className="mt-2 line-clamp-2 max-w-48 text-xs text-destructive" title={row.failureReason}>{row.failureReason}</p> : null}
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        <p><span className="text-muted-foreground">{t("Created")}:</span> {formatPlatformDate(row.createdAt ?? row.at, { dateStyle: "medium", timeStyle: "short" })}</p>
                        {row.paidAt || row.verifiedAt || row.failedAt ? <p className="mt-1.5"><span className="text-muted-foreground">{t(row.failedAt ? "Failed" : "Finalized")}:</span> {formatPlatformDate(row.paidAt ?? row.verifiedAt ?? row.failedAt ?? row.at, { dateStyle: "medium", timeStyle: "short" })}</p> : null}
                      </TableCell>
                      <TableCell className="sticky end-0 bg-card/95 align-top backdrop-blur">
                        <Button asChild size="sm" variant="outline"><Link href={`/admin/finance/payments/${row.id}` as never}><Eye className="size-4" />{t("View")}</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              ) : isWalletTransactionList ? (
              <Table className="min-w-[1450px]" dir={dir}>
                <TableHeader><TableRow><TableHead className="min-w-56">{t("Exact transaction time")}</TableHead><TableHead className="min-w-60">{t("User profile")}</TableHead><TableHead>{t("Transaction type")}</TableHead><TableHead>{t("Wallet")}</TableHead><TableHead>{t("Balance change")}</TableHead><TableHead>{t("Balance after transaction")}</TableHead><TableHead className="min-w-72">{t("Description and reference")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead className="min-w-60 text-start">{t("Actions")}</TableHead></TableRow></TableHeader>
                <TableBody>{rows.map((row) => {
                  const actions = getRowActions(pathname, row);
                  return <TableRow key={`${row.id}-${row.at}`}>
                    <TableCell className="align-top text-sm tabular-nums">{formatPlatformDate(row.createdAt ?? row.at, { dateStyle: "medium", timeStyle: "medium" })}</TableCell>
                    <TableCell className="align-top"><AdminUserLink userId={row.userId}>{row.customer}</AdminUserLink>{row.mobile ? <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{row.mobile}</p> : null}{row.customerEmail ? <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{row.customerEmail}</p> : null}</TableCell>
                    <TableCell className="align-top"><Badge variant="outline">{t(row.type ?? "Not provided")}</Badge></TableCell>
                    <TableCell className="align-top">{t(row.currency ?? "Not provided")}</TableCell>
                    <TableCell className={`align-top font-bold tabular-nums ${Number(row.amount ?? 0) < 0 ? "text-destructive" : "text-emerald-600"}`}>{formatWalletValue(row.amount, row.currency, lang)}</TableCell>
                    <TableCell className="align-top font-semibold tabular-nums">{formatWalletValue(row.balanceAfter, row.currency, lang)}</TableCell>
                    <TableCell className="align-top"><p>{row.description ?? row.label}</p>{row.reference ? <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{row.reference}</p> : null}</TableCell>
                    <TableCell className="align-top"><Badge variant="outline">{t(row.status)}</Badge></TableCell>
                    <TableCell className="align-top text-start"><div className="flex flex-wrap gap-2">{actions.edit ? <Button asChild size="sm" variant="outline"><Link href={actions.edit}><Eye className="size-4" />{t("User profile")}</Link></Button> : null}{actions.adjust ? <Button asChild disabled={!adjustAllowed} size="sm" variant="ghost"><Link href={actions.adjust}>{t("Adjust balance")}</Link></Button> : null}</div></TableCell>
                  </TableRow>;
                })}</TableBody>
              </Table>
              ) : (
              <Table dir={dir}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t("Select")}</TableHead>
                    <TableHead>{t("Record")}</TableHead>
                    {showOwnerColumn ? <TableHead>{t("Owner")}</TableHead> : null}
                    <TableHead>{t("Status")}</TableHead>
                    {showUpdatedColumn ? <TableHead>{t("Updated")}</TableHead> : null}
                    <TableHead className="text-start">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const actions = getRowActions(pathname, row);
                    return (
                    <TableRow key={`${row.id}-${row.label}-${row.at}`}>
                      <TableCell>
                        <Checkbox
                          aria-label={`${t("Select")} ${row.label}`}
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={(checked) => {
                            setSelectedRows((current) =>
                              checked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id),
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{row.label}</span>
                            {pathname === "/admin/support/live-chat" ? (
                              <Badge variant={row.online ? "default" : "outline"}>{row.online ? t("Online") : t("Offline")}</Badge>
                            ) : null}
                          </div>
                          {row.meta ? <p className="mt-1 max-w-xl truncate text-xs font-normal text-muted-foreground">{row.meta}</p> : null}
                        </div>
                      </TableCell>
                      {showOwnerColumn ? <TableCell><AdminUserLink userId={row.userId}>{row.customer}</AdminUserLink></TableCell> : null}
                      <TableCell>
                        <Badge variant="outline">{t(row.status)}</Badge>
                      </TableCell>
                      {showUpdatedColumn ? (
                        <TableCell className="text-muted-foreground">{formatPlatformDate(row.at, { dateStyle: "medium" })}</TableCell>
                      ) : null}
                      <TableCell className="text-start">
                        <div className="flex items-center gap-2">
                          {actions.reply ? (
                            <Button asChild disabled={!allowed} size="sm" variant="outline">
                              <a href={actions.reply}>
                                <MessageSquareReply className="size-4" />
                                {t("Reply")}
                              </a>
                            </Button>
                          ) : null}
                          {actions.quickEdit ? (
                            <Button disabled={!quickAllowed} onClick={() => openQuickEditor(row)} size="sm" variant="outline">
                              <Pencil className="size-4" />
                              {t("Edit")}
                            </Button>
                          ) : null}
                          {actions.workflow ? (
                            <Button disabled={!workflowAllowed} onClick={() => openWorkflow(row)} size="sm" variant="outline">
                              <ClipboardCheck className="size-4" />
                              {t(workflow?.actionLabel ?? "Update")}
                            </Button>
                          ) : null}
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label={t("Row actions")}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.view ? (
                              <DropdownMenuItem asChild disabled={!allowed}>
                                <a href={actions.view}>
                                  <Eye className="size-4" />
                                  {t("View")}
                                </a>
                              </DropdownMenuItem>
                            ) : null}
                            {actions.reply ? (
                              <DropdownMenuItem asChild disabled={!allowed}>
                                <a href={actions.reply}>
                                  <MessageSquareReply className="size-4" />
                                  {t("Reply")}
                                </a>
                              </DropdownMenuItem>
                            ) : null}
                            {actions.edit ? (
                              <DropdownMenuItem asChild disabled={!allowed}>
                                <a href={actions.edit}>
                                  <Pencil className="size-4" />
                                  {t("Edit")}
                                </a>
                              </DropdownMenuItem>
                            ) : null}
                            {actions.quickEdit ? (
                              <DropdownMenuItem disabled={!quickAllowed} onClick={() => openQuickEditor(row)}>
                                <Pencil className="size-4" />
                                {t("Edit")}
                              </DropdownMenuItem>
                            ) : null}
                            {actions.workflow ? (
                              <DropdownMenuItem disabled={!workflowAllowed} onClick={() => openWorkflow(row)}>
                                <ClipboardCheck className="size-4" />
                                {t(workflow?.actionLabel ?? "Update")}
                              </DropdownMenuItem>
                            ) : null}
                            {actions.adjust ? (
                              <DropdownMenuItem asChild disabled={!adjustAllowed}>
                                <Link href={actions.adjust}>
                                  <CircleDollarSign className="size-4" />
                                  {t("Adjust balance")}
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                            {actions.site ? (
                              <DropdownMenuItem asChild disabled={!allowed}>
                                <a href={actions.site} target="_blank">
                                  <Eye className="size-4" />
                                  {t("View on site")}
                                </a>
                              </DropdownMenuItem>
                            ) : null}
                            {actions.invoicePdf ? (
                              <DropdownMenuItem disabled={!allowed || invoicePdf.isPending} onClick={() => invoicePdf.mutate(row.id)}>
                                {invoicePdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                                {t("Download PDF")}
                              </DropdownMenuItem>
                            ) : null}
                            {!actions.view && !actions.reply && !actions.edit && !actions.quickEdit && !actions.workflow && !actions.adjust && !actions.site && !actions.invoicePdf ? (
                              <DropdownMenuItem disabled={!allowed} onClick={() => downloadRowsCsv(row.label, [row], t)}>
                                <Download className="size-4" />
                                {t("Export row")}
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
              )
            ) : (
              <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
                {t("No records match the current filters.")}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t("Showing")} {rows.length} {t("of")} {total} {t("records")}.
              </p>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || resourceQuery.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">
                  {t("Previous")}
                </Button>
                <Button disabled={page >= totalPages || resourceQuery.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">
                  {t("Next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={quickEditorOpen} onOpenChange={(open) => {
        setQuickEditorOpen(open);
        if (!open) {
          setQuickEditorRow(undefined);
          setQuickForm(createEmptyQuickForm());
        }
      }}>
        <DialogContent className="sm:max-w-xl" dir={dir}>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); saveQuickResource.mutate(); }}>
            <DialogHeader>
              <DialogTitle>{t(quickEditorRow ? quickEditor?.editLabel ?? "Edit record" : quickEditor?.createLabel ?? "Create record")}</DialogTitle>
              <DialogDescription>{t("Complete the fields below and save the record.")}</DialogDescription>
            </DialogHeader>
            {quickEditor?.kind === "expense" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <QuickField label={t("Category")} onChange={(category) => setQuickForm((current) => ({ ...current, category }))} required value={quickForm.category} />
                <QuickField label={t("Vendor")} onChange={(vendor) => setQuickForm((current) => ({ ...current, vendor }))} value={quickForm.vendor} />
                <QuickField dir="ltr" label={t("Amount")} min="0" onChange={(amount) => setQuickForm((current) => ({ ...current, amount }))} required type="number" value={quickForm.amount} />
                <QuickField dir="ltr" label={t("Tax amount")} min="0" onChange={(taxAmount) => setQuickForm((current) => ({ ...current, taxAmount }))} type="number" value={quickForm.taxAmount} />
                <QuickField dir="ltr" label={t("Currency")} onChange={(currency) => setQuickForm((current) => ({ ...current, currency }))} required value={quickForm.currency} />
                <QuickField dir="ltr" label={t("Occurred at")} onChange={(occurredAt) => setQuickForm((current) => ({ ...current, occurredAt }))} required type="date" value={quickForm.occurredAt} />
                <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">{t("Description")}</span><Textarea onChange={(event) => setQuickForm((current) => ({ ...current, description: event.target.value }))} required value={quickForm.description} /></label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <QuickField label={t(quickEditor?.kind === "department" ? "Name" : "Title")} onChange={(name) => setQuickForm((current) => ({ ...current, name }))} required value={quickForm.name} />
                <QuickField disabled={!!quickEditorRow} dir="ltr" label={t("Slug")} onChange={(slug) => setQuickForm((current) => ({ ...current, slug }))} required value={quickForm.slug} />
                {quickEditor?.kind === "department" ? <QuickField dir="ltr" label={t("Email")} onChange={(email) => setQuickForm((current) => ({ ...current, email }))} type="email" value={quickForm.email} /> : null}
                <QuickField dir="ltr" label={t("Sort order")} min="0" onChange={(sortOrder) => setQuickForm((current) => ({ ...current, sortOrder }))} type="number" value={quickForm.sortOrder} />
                {quickEditor?.kind === "blog-category" || quickEditor?.kind === "blog-tag" ? (
                  <Label className="space-y-2 sm:col-span-2"><span>{t("Status")}</span><Select dir={dir} onValueChange={(status) => setQuickForm((current) => ({ ...current, status }))} value={quickForm.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DRAFT", "PUBLISHED", "ARCHIVED"].map((option) => <SelectItem key={option} value={option}>{t(option)}</SelectItem>)}</SelectContent></Select></Label>
                ) : null}
                {quickEditor?.kind !== "blog-tag" ? <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">{t("Description")}</span><Textarea onChange={(event) => setQuickForm((current) => ({ ...current, description: event.target.value }))} value={quickForm.description} /></label> : null}
              </div>
            )}
            <DialogFooter>
              <Button disabled={!isQuickFormReady(quickEditor?.kind, quickForm) || saveQuickResource.isPending} type="submit">
                {saveQuickResource.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t(quickEditorRow ? "Save changes" : "Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!workflowRow} onOpenChange={(open) => { if (!open) { setWorkflowRow(undefined); setWorkflowForm({ status: "" }); } }}>
        <DialogContent className="sm:max-w-xl" dir={dir}>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); saveWorkflow.mutate(); }}>
            <DialogHeader>
              <DialogTitle>{t(workflow?.title ?? "Update record")}</DialogTitle>
              <DialogDescription>{workflowRow?.label}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="space-y-2 sm:col-span-2">
                <span>{t("Status")}</span>
                <Select dir={dir} onValueChange={(status) => setWorkflowForm((current) => ({ ...current, status }))} value={workflowForm.status}>
                  <SelectTrigger><SelectValue placeholder={t("Select status")} /></SelectTrigger>
                  <SelectContent>{(workflow?.statuses ?? []).map((option) => <SelectItem key={option} value={option}>{t(option.replaceAll("_", " "))}</SelectItem>)}</SelectContent>
                </Select>
              </Label>
              {workflow?.kind === "kyc" && workflowForm.status === "REJECTED" ? <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">{t("Rejection reason")}</span><Textarea onChange={(event) => setWorkflowForm((current) => ({ ...current, rejectionReason: event.target.value }))} required value={workflowForm.rejectionReason ?? ""} /></label> : null}
              {workflow?.kind === "delivery" ? (
                <>
                  <QuickField dir="ltr" label={t("Tracking code")} onChange={(trackingCode) => setWorkflowForm((current) => ({ ...current, trackingCode }))} value={workflowForm.trackingCode} />
                  <QuickField dir="ltr" label={t("Sealed package code")} onChange={(sealedPackageCode) => setWorkflowForm((current) => ({ ...current, sealedPackageCode }))} value={workflowForm.sealedPackageCode} />
                  <QuickField dir="ltr" label={t("Certificate number")} onChange={(certificateNumber) => setWorkflowForm((current) => ({ ...current, certificateNumber }))} value={workflowForm.certificateNumber} />
                  <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">{t("Admin note")}</span><Textarea onChange={(event) => setWorkflowForm((current) => ({ ...current, adminNote: event.target.value }))} value={workflowForm.adminNote ?? ""} /></label>
                </>
              ) : null}
            </div>
            <DialogFooter>
              <Button disabled={!isWorkflowReady(workflow?.kind, workflowForm) || saveWorkflow.isPending} type="submit">
                {saveWorkflow.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("Save changes")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function PaymentReference({ label, value }: { label: string; value?: string }) {
  return <p className="mb-1.5 flex min-w-0 items-center justify-between gap-2 text-xs"><span className="shrink-0 text-muted-foreground">{label}</span><span className="max-w-36 truncate font-mono" dir="ltr" title={value}>{value ?? "—"}</span></p>;
}

function paymentGatewayLabel(gateway: string | undefined, t: (text: string) => string) {
  if (gateway === "zarinpal") return t("Zarinpal");
  if (gateway === "wallet") return t("Toman wallet");
  if (gateway === "silver-wallet") return t("Silver wallet");
  return gateway || t("Unknown gateway");
}

function productOrderPaymentMethodLabel(method: string, t: (text: string) => string) {
  if (method === "gateway") return t("Online gateway");
  if (method === "wallet") return t("Toman wallet / shopping credit");
  if (method === "silver-wallet") return t("Silver wallet");
  return t("All payment methods");
}

function paymentStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  if (status === "PAID") return "default";
  if (status === "FAILED" || status === "CANCELLED") return "destructive";
  if (status === "PROCESSING") return "secondary";
  return "outline";
}

function silverOrderStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  if (status === "COMPLETED") return "default";
  if (status === "REJECTED" || status === "CANCELLED") return "destructive";
  if (status === "QUOTED") return "secondary";
  return "outline";
}

function formatSilverNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("fa-IR", { maximumFractionDigits: 3 }) : value;
}

type AdminQuickRow = AdminResourceRow;
type QuickEditorKind = "blog-category" | "blog-tag" | "department" | "expense";
type WorkflowKind = "delivery" | "kyc";

interface QuickEditorConfig {
  createLabel: string;
  editLabel: string;
  endpoint: string;
  kind: QuickEditorKind;
  permission: string;
}

interface WorkflowConfig {
  actionLabel: string;
  endpoint: string;
  kind: WorkflowKind;
  permission: string;
  statuses: string[];
  title: string;
}

interface QuickForm {
  amount: string;
  category: string;
  currency: string;
  description: string;
  descriptionTranslations: Record<string, string>;
  email: string;
  name: string;
  occurredAt: string;
  slug: string;
  sortOrder: string;
  status: string;
  taxAmount: string;
  titleTranslations: Record<string, string>;
  vendor: string;
}

interface WorkflowForm {
  adminNote?: string;
  certificateNumber?: string;
  rejectionReason?: string;
  sealedPackageCode?: string;
  status: string;
  trackingCode?: string;
}

interface RowActions {
  adjust?: string;
  edit?: string;
  invoicePdf?: boolean;
  invoicePrint?: boolean;
  quickEdit?: boolean;
  reply?: string;
  site?: string;
  view?: string;
  workflow?: boolean;
}

function getQuickEditorConfig(pathname: string): QuickEditorConfig | undefined {
  if (pathname === "/admin/content/blog/categories") return { createLabel: "Add category", editLabel: "Edit category", endpoint: "/admin/blog/categories", kind: "blog-category", permission: "blog.create" };
  if (pathname === "/admin/content/blog/tags") return { createLabel: "Add tag", editLabel: "Edit tag", endpoint: "/admin/blog/tags", kind: "blog-tag", permission: "blog.create" };
  if (pathname === "/admin/support/departments") return { createLabel: "Add department", editLabel: "Edit department", endpoint: "/admin/support/departments", kind: "department", permission: "tickets.assign" };
  if (pathname === "/admin/finance/accounting/expenses") return { createLabel: "Add expense", editLabel: "Edit expense", endpoint: "/admin/accounting/expenses", kind: "expense", permission: "payments.view" };
  return undefined;
}

function getWorkflowConfig(pathname: string): WorkflowConfig | undefined {
  if (pathname === "/admin/kyc/reviews") return { actionLabel: "Review", endpoint: "/admin/silver/kyc", kind: "kyc", permission: "silver.kyc.manage", statuses: ["APPROVED", "REJECTED"], title: "Review KYC" };
  if (pathname === "/admin/delivery/requests" || pathname === "/admin/delivery/tracking") return { actionLabel: "Update", endpoint: "/admin/silver/delivery", kind: "delivery", permission: "silver.delivery.manage", statuses: ["REQUESTED", "APPROVED", "PACKAGING", "SEALED", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED", "CANCELLED", "REJECTED"], title: "Update delivery" };
  return undefined;
}

function createEmptyQuickForm(): QuickForm {
  return {
    amount: "",
    category: "",
    currency: "TOMAN",
    description: "",
    descriptionTranslations: {},
    email: "",
    name: "",
    occurredAt: new Date().toISOString().slice(0, 10),
    slug: "",
    sortOrder: "0",
    status: "PUBLISHED",
    taxAmount: "0",
    titleTranslations: {},
    vendor: "",
  };
}

function quickFormFromRow(row: AdminQuickRow): QuickForm {
  return {
    ...createEmptyQuickForm(),
    description: row.description ?? "",
    descriptionTranslations: row.descriptionTranslations ?? {},
    email: row.email ?? "",
    name: row.label,
    slug: row.slug ?? "",
    sortOrder: String(row.sortOrder ?? 0),
    status: ["ARCHIVED", "DRAFT", "PUBLISHED"].includes(row.status) ? row.status : "PUBLISHED",
    titleTranslations: row.titleTranslations ?? {},
  };
}

function buildQuickPayload(kind: QuickEditorKind, form: QuickForm): Record<string, unknown> {
  if (kind === "expense") {
    return {
      amount: Number(form.amount),
      category: form.category.trim(),
      currency: form.currency.trim() || "TOMAN",
      description: form.description.trim(),
      occurredAt: new Date(`${form.occurredAt}T00:00:00.000Z`).toISOString(),
      status: "DRAFT",
      taxAmount: Number(form.taxAmount || 0),
      vendor: cleanValue(form.vendor),
    };
  }
  if (kind === "department") {
    return {
      description: cleanValue(form.description),
      email: cleanValue(form.email),
      name: form.name.trim(),
      slug: form.slug.trim(),
      sortOrder: Number(form.sortOrder || 0),
    };
  }
  return {
    description: kind === "blog-category" && form.description.trim() ? { ...form.descriptionTranslations, fa: form.description.trim() } : undefined,
    slug: form.slug.trim(),
    sortOrder: Number(form.sortOrder || 0),
    status: form.status,
    title: { ...form.titleTranslations, fa: form.name.trim() },
  };
}

function buildWorkflowPayload(kind: WorkflowKind, form: WorkflowForm): Record<string, unknown> {
  if (kind === "kyc") return { rejectionReason: form.status === "REJECTED" ? cleanValue(form.rejectionReason) : undefined, status: form.status };
  return {
    adminNote: cleanValue(form.adminNote),
    certificateNumber: cleanValue(form.certificateNumber),
    sealedPackageCode: cleanValue(form.sealedPackageCode),
    status: form.status,
    trackingCode: cleanValue(form.trackingCode),
  };
}

function isQuickFormReady(kind: QuickEditorKind | undefined, form: QuickForm) {
  if (kind === "expense") return !!form.category.trim() && !!form.description.trim() && !!form.occurredAt && Number.isFinite(Number(form.amount)) && Number(form.amount) >= 0;
  return !!kind && !!form.name.trim() && !!form.slug.trim();
}

function isWorkflowReady(kind: WorkflowKind | undefined, form: WorkflowForm) {
  return !!kind && !!form.status && !(kind === "kyc" && form.status === "REJECTED" && !form.rejectionReason?.trim());
}

function cleanValue(value?: string) {
  return value?.trim() || undefined;
}

function QuickField({ disabled, dir, label, min, onChange, required, type = "text", value }: { disabled?: boolean; dir?: "ltr" | "rtl"; label: string; min?: string; onChange: (value: string) => void; required?: boolean; type?: string; value?: string }) {
  return <Label className="space-y-2"><span>{label}</span><Input dir={dir} disabled={disabled} min={min} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value ?? ""} /></Label>;
}

function getCreateHref(pathname: string) {
  if (pathname === "/admin/shop/products") return "/admin/products/create";
  if (pathname === "/admin/content/blog") return "/admin/content/blog/create";
  if (pathname === "/admin/support/tickets") return "/admin/support/tickets/create";
  if (pathname === "/admin/finance/invoices") return "/admin/finance/invoices/create";
  return undefined;
}

function getRowActions(pathname: string, row: AdminQuickRow): RowActions {
  const customerEdit = row.userId ? `/admin/users/${row.userId}/edit` : undefined;
  const adjust = row.userId ? `/admin/finance/wallet-adjustments?userId=${encodeURIComponent(row.userId)}` : undefined;
  if (["/admin/silver/holdings", "/admin/finance/wallet-transactions", "/admin/finance/accounting/balances"].includes(pathname)) {
    return { adjust, edit: customerEdit };
  }
  if (pathname === "/admin/kyc/reviews") {
    return { edit: customerEdit, workflow: true };
  }
  if (pathname === "/admin/delivery/requests" || pathname === "/admin/delivery/tracking") {
    return { edit: customerEdit, workflow: true };
  }
  if (pathname === "/admin/support/agents" || pathname === "/admin/access/teams") {
    return { edit: `/admin/access/users/${row.id}/edit` };
  }
  if (["/admin/content/blog/categories", "/admin/content/blog/tags", "/admin/support/departments"].includes(pathname)) {
    return { quickEdit: true };
  }
  if (pathname === "/admin/silver/orders") {
    return { view: `/admin/silver/orders/${row.id}` };
  }
  if (pathname === "/admin/shop/products") {
    return {
      edit: `/admin/products/${row.id}/edit`,
      site: row.slug ? `/products/${row.slug}` : undefined,
      view: `/admin/products/${row.id}`,
    };
  }
  if (pathname === "/admin/content/blog") {
    return {
      edit: `/admin/content/blog/${row.id}/edit`,
      site: row.slug ? `/blog/${row.slug}` : undefined,
      view: `/admin/content/blog/${row.id}`,
    };
  }
  if (pathname === "/admin/content/pages" && row.slug) {
    const publicSlugs = new Set(["about", "contact", "faq", "fees"]);
    return {
      edit: `/admin/content/pages/${row.slug}`,
      site: publicSlugs.has(row.slug) ? `/${row.slug}` : undefined,
    };
  }
  if (pathname.startsWith("/admin/shop/orders")) {
    if (pathname === "/admin/shop/orders/refunded") {
      return {
        view: `/admin/finance/payments/refunds/${row.id}`,
      };
    }
    return {
      view: `/admin/shop/orders/${row.id}`,
    };
  }
  if (pathname.startsWith("/admin/finance/invoices")) {
    return {
      invoicePdf: true,
      invoicePrint: true,
      view: `/admin/finance/invoices/${row.id}`,
    };
  }
  if (pathname.startsWith("/admin/finance/payments") && !pathname.endsWith("/refunds")) {
    return {
      view: `/admin/finance/payments/${row.id}`,
    };
  }
  if (pathname === "/admin/finance/payments/refunds") {
    return {
      view: `/admin/finance/payments/refunds/${row.id}`,
    };
  }
  if (pathname === "/admin/support/tickets") {
    return {
      edit: `/admin/support/tickets/${row.id}/edit`,
      view: `/admin/support/tickets/${row.id}`,
    };
  }
  if (pathname === "/admin/support/live-chat") {
    return {
      reply: `/admin/support/live-chat/${row.id}`,
      view: `/admin/support/live-chat/${row.id}`,
    };
  }
  return {};
}

function downloadRowsCsv(
  label: string,
  rows: AdminResourceRow[],
  t: (text: string) => string,
) {
  if (!rows.length || typeof window === "undefined") return;
  const headers = ["id", "label", "owner", "mobile", "email", "type", "paymentMethod", "gateway", "grams", "pricePerGram", "grossAmount", "feeAmount", "total", "status", "transactionAt", "transactionReference", "paymentNumber", "invoiceNumber", "updatedAt", "slug"];
  const body = rows.map((row) => [row.id, row.label, row.customer, row.mobile ?? "", row.customerEmail ?? "", row.type ?? "", row.paymentMethod ?? "", row.gateway ?? "", row.grams ?? "", row.pricePerGram ?? "", row.grossAmount ?? "", row.feeAmount ?? "", row.total ?? "", row.status, row.transactionAt ?? row.at, row.transactionReference ?? row.referenceId ?? row.transactionId ?? "", row.paymentNumber ?? "", row.invoiceNumber ?? "", row.at, row.slug ?? ""].map(csvCell).join(","));
  const blob = new Blob([[headers.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${label.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "admin-records"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success(t("Export downloaded."));
}

function csvCell(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function formatWalletValue(value: string | undefined, currency: string | undefined, lang: string) {
  if (value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  const locale = lang === "fa" ? "fa-IR" : "en-US";
  const silver = currency === "SILVER_GRAM";
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: silver ? 3 : 0 }).format(numeric);
  return `${formatted} ${silver ? (lang === "fa" ? "گرم" : "g") : (lang === "fa" ? "تومان" : "Toman")}`;
}

function SectionSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ShadowSkeleton className="h-28" key={index} />
        ))}
      </div>
      <ShadowSkeleton className="h-[32rem]" />
    </div>
  );
}
