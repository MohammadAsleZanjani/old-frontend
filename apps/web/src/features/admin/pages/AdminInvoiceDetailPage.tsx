"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Download, FileText, Loader2, Printer, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "@/shared/ui/sonner";

import { downloadAdminInvoicePdf, getAdminInvoiceDetail, getAdminOverview, printAdminInvoicePdf, type AdminInvoiceDetail } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminInvoiceDetailPage({ invoiceId }: { invoiceId: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const isRtl = lang !== "en";
  const BackIcon = isRtl ? ArrowLeft : ArrowRight;
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("invoices.view"));
  const invoice = useQuery({
    enabled: allowed,
    queryFn: () => getAdminInvoiceDetail(invoiceId),
    queryKey: ["admin-invoice-detail", invoiceId],
    retry: 1,
  });
  const downloadPdf = useMutation({
    mutationFn: () => downloadAdminInvoicePdf(invoiceId),
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
  const printPdf = useMutation({
    mutationFn: () => printAdminInvoicePdf(invoiceId),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Invoice print failed")),
    onSuccess: () => toast.success(t("Print dialog opened.")),
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <InvoiceDetailSkeleton />
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

  if (!allowed) {
    return (
      <AdminShell access={access}>
        <Alert>
          <AlertTitle>{t("Permission required")}</AlertTitle>
          <AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Finance / Invoices")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{invoice.data?.invoiceNumber ?? t("Invoice detail")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Review invoice items, totals, payments, refunds, related order, and downloadable PDF artifact.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={"/admin/finance/invoices" as never}>
                <BackIcon className="size-4" />
                {t("Back to invoices")}
              </Link>
            </Button>
            <Button disabled={printPdf.isPending || invoice.isLoading || invoice.isError} onClick={() => printPdf.mutate()} variant="outline">
              {printPdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
              {t("Print")}
            </Button>
            <Button disabled={downloadPdf.isPending || invoice.isLoading || invoice.isError} onClick={() => downloadPdf.mutate()}>
              {downloadPdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {t("Download PDF")}
            </Button>
          </div>
        </section>

        {invoice.isLoading ? <InvoiceDetailSkeleton /> : null}

        {invoice.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Invoice unavailable")}</AlertTitle>
            <AlertDescription>{invoice.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {invoice.data ? <InvoiceDetail invoice={invoice.data} /> : null}
      </div>
    </AdminShell>
  );
}

function InvoiceDetail({ invoice }: { invoice: AdminInvoiceDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const customer = invoice.user;
  const address = customer?.addresses?.[0];
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Status")} value={invoice.status} />
        <MetricCard label={t("Total")} value={formatInvoiceMoney(invoice.total, invoice.currency)} />
        <MetricCard label={t("Balance due")} value={formatInvoiceMoney(invoice.balanceDue, invoice.currency)} />
        <MetricCard label={t("Issued")} value={formatDate(invoice.createdAt)} />
      </section>

      <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader>
          <CardTitle>{t("Customer and billing details")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DetailField label={t("Name and last name")} value={<AdminUserLink userId={customer?.id}>{formatCustomerName(customer) || t("Not provided")}</AdminUserLink>} />
          <DetailField label={t("Mobile")} value={formatMobileDisplay(customer?.mobile)} />
          <DetailField label={t("Email")} value={customer?.email ?? customer?.companyProfile?.billingEmail} />
          <DetailField label={t("ID / National no.")} value={customer?.profile?.idCardNo} />
          <DetailField label={t("Company")} value={customer?.companyProfile?.companyName} />
          <DetailField label={t("Registration no.")} value={customer?.companyProfile?.registrationNo} />
          <DetailField label={t("Tax ID")} value={customer?.companyProfile?.taxId} />
          <DetailField label={t("Address phone")} value={address?.phone} />
          <div className="md:col-span-2 xl:col-span-4">
            <DetailField label={t("Billing address")} value={formatAddress(address)} />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {t("Invoice items")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Description")}</TableHead>
                    <TableHead>{t("Qty")}</TableHead>
                    <TableHead>{t("Unit")}</TableHead>
                    <TableHead>{t("Total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatInvoiceMoney(item.unitPrice, item.currency)}</TableCell>
                      <TableCell>{formatInvoiceMoney(item.total, item.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
                {t("No invoice items are attached.")}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Totals")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AmountRow label={t("Subtotal")} value={formatInvoiceMoney(invoice.subtotal, invoice.currency)} />
              <AmountRow label={t("Discount")} value={formatInvoiceMoney(invoice.discount, invoice.currency)} />
              <AmountRow label={t("Tax")} value={formatInvoiceMoney(invoice.tax, invoice.currency)} />
              <AmountRow label={t("Total")} strong value={formatInvoiceMoney(invoice.total, invoice.currency)} />
              <AmountRow label={t("Balance due")} strong value={formatInvoiceMoney(invoice.balanceDue, invoice.currency)} />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Related records")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {invoice.order ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/35 p-3">
                  <div>
                    <Link className="font-semibold hover:text-primary" href={`/admin/shop/orders/${invoice.order.id}` as never}>{invoice.order.orderNumber}</Link>
                    <p className="text-xs text-muted-foreground">{t("Order status")}: {t(invoice.order.status)}</p>
                  </div>
                  <Badge variant="outline">{t("Order")}</Badge>
                </div>
              ) : (
                <p className="text-muted-foreground">{t("No related order.")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RecordList
          emptyLabel={t("No payments have been logged.")}
          icon={<ReceiptText className="size-5 text-primary" />}
          items={invoice.payments.map((payment) => ({
            href: `/admin/finance/payments/${payment.id}`,
            meta: `${formatInvoiceMoney(payment.amount, payment.currency)} · ${formatDate(payment.createdAt)}`,
            status: payment.status,
            title: payment.paymentNumber,
          }))}
          title={t("Payments")}
        />
        <RecordList
          emptyLabel={t("No refunds have been logged.")}
          icon={<ReceiptText className="size-5 text-primary" />}
          items={invoice.refunds.map((refund) => ({
            href: `/admin/finance/payments/refunds/${refund.id}`,
            meta: `${formatInvoiceMoney(refund.amount, refund.currency)} · ${formatDate(refund.createdAt)}`,
            status: refund.status,
            title: refund.refundNumber,
          }))}
          title={t("Refunds")}
        />
      </section>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="truncate text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function AmountRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background/35 px-3 py-2">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: ReactNode }) {
  const { lang } = useI18n();
  return (
    <div className="rounded-lg border border-border bg-background/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold">{value || translateUiText("Not provided", lang)}</div>
    </div>
  );
}

function formatCustomerName(customer?: AdminInvoiceDetail["user"]) {
  const profileName = [customer?.profile?.firstName, customer?.profile?.lastName].filter(Boolean).join(" ");
  return profileName || customer?.email || formatMobileDisplay(customer?.mobile);
}

function formatAddress(address?: {
  city: string;
  country: string;
  line1: string;
  line2?: string | null;
  postalCode?: string | null;
  province?: string | null;
  recipient?: string | null;
}) {
  if (!address) return undefined;
  return [
    address.recipient,
    address.line1,
    address.line2,
    address.city,
    address.province,
    address.country,
    address.postalCode,
  ].map(cleanAddressPart).filter(Boolean).join(", ");
}

function cleanAddressPart(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized || ["ir", "unknown"].includes(normalized.toLowerCase())) return undefined;
  return normalized;
}

function formatInvoiceMoney(amount: string, currency: string) {
  if (isTomanCurrency(currency)) return formatTomanMoney(amount, currency);
  const label = displayCurrency(currency);
  return `${formatDisplayAmount(amount, label)} ${label}`;
}

function displayCurrency(currency: string) {
  const normalized = currency.trim();
  if (["r", "rial", "irr", "ریال"].includes(normalized.toLowerCase())) return "تومان";
  return normalized;
}

function formatDisplayAmount(amount: string, currency: string) {
  if (!currencyHasNoDecimals(currency)) return amount;
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? String(Math.round(numeric)) : amount.replace(/\.0+$/, "");
}

function currencyHasNoDecimals(currency: string) {
  const normalized = currency.trim().toLowerCase();
  return normalized.includes("تومان") || normalized.includes("toman") || normalized === "irt";
}

function RecordList({ emptyLabel, icon, items, title }: { emptyLabel: string; icon: ReactNode; items: Array<{ href?: string; meta: string; status: string; title: string }>; title: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? items.map((item) => (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/35 p-3" key={item.title}>
            <div className="min-w-0">
              {item.href ? (
                <Link className="truncate text-sm font-semibold hover:text-primary" href={item.href as never}>{item.title}</Link>
              ) : (
                <p className="truncate text-sm font-semibold">{item.title}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>
            </div>
            <Badge className="shrink-0" variant="outline">{t(item.status)}</Badge>
          </div>
        )) : (
          <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28 rounded-lg" key={index} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ShadowSkeleton className="h-96 rounded-lg" />
        <ShadowSkeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium" });
}
