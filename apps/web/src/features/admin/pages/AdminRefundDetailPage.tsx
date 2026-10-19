"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, FileText, ReceiptText, ShoppingBag, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { getAdminOverview, getAdminRefundDetail, type AdminRefundDetail } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

export function AdminRefundDetailPage({ refundId }: { refundId: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("refunds.manage"));
  const refund = useQuery({
    enabled: allowed,
    queryFn: () => getAdminRefundDetail(refundId),
    queryKey: ["admin-refund-detail", refundId],
    retry: 1,
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <RefundDetailSkeleton />
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
            <Badge className="w-fit" variant="outline">{t("Finance / Refunds")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{refund.data?.refundNumber ?? t("Refund detail")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Review refund amount, reason, customer context, source payment, related invoice/order, and processing status.")}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/admin/finance/payments/refunds" as never}>
              <ArrowRight className="size-4" />
              {t("Back to refunds")}
            </Link>
          </Button>
        </section>

        {refund.isLoading ? <RefundDetailSkeleton /> : null}

        {refund.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Refund unavailable")}</AlertTitle>
            <AlertDescription>{refund.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {refund.data ? <RefundDetail refund={refund.data} /> : null}
      </div>
    </AdminShell>
  );
}

function RefundDetail({ refund }: { refund: AdminRefundDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Status")} value={t(refund.status)} />
        <MetricCard label={t("Amount")} value={`${refund.amount} ${t(refund.currency)}`} />
        <MetricCard label={t("Created")} value={formatDate(refund.createdAt)} />
        <MetricCard label={t("Processed")} value={refund.processedAt ? formatDate(refund.processedAt) : t("Pending")} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-5 text-primary" />
              {t("Refund reason")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {refund.reason ? (
              <p className="rounded-lg border border-border bg-background/35 p-4 text-sm leading-7">{refund.reason}</p>
            ) : (
              <EmptyBox label={t("No refund reason was provided.")} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              {t("Customer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoLine label={t("Name")} value={<AdminUserLink userId={refund.user?.id}>{customerName(refund)}</AdminUserLink>} />
            <InfoLine label={t("Email")} value={refund.user?.email ?? "-"} />
            <InfoLine label={t("Mobile")} value={formatMobileDisplay(refund.user?.mobile) || "-"} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RelatedCard
          emptyLabel={t("No source payment.")}
          href={refund.payment ? `/admin/finance/payments/${refund.payment.id}` : undefined}
          icon={<CreditCard className="size-5 text-primary" />}
          meta={refund.payment ? `${refund.payment.amount} ${t(refund.payment.currency)} · ${refund.payment.gateway}` : undefined}
          status={refund.payment?.status}
          title={refund.payment?.paymentNumber}
          heading={t("Payment")}
        />
        <RelatedCard
          emptyLabel={t("No related invoice.")}
          href={refund.invoice ? `/admin/finance/invoices/${refund.invoice.id}` : undefined}
          icon={<FileText className="size-5 text-primary" />}
          meta={refund.invoice ? `${refund.invoice.total} total` : undefined}
          status={refund.invoice?.status}
          title={refund.invoice?.invoiceNumber}
          heading={t("Invoice")}
        />
        <RelatedCard
          emptyLabel={t("No related order.")}
          href={refund.order ? `/admin/shop/orders/${refund.order.id}` : undefined}
          icon={<ShoppingBag className="size-5 text-primary" />}
          meta={refund.order ? `${refund.order.total} total` : undefined}
          status={refund.order?.status}
          title={refund.order?.orderNumber}
          heading={t("Order")}
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

function RelatedCard({ emptyLabel, heading, href, icon, meta, status, title }: { emptyLabel: string; heading: string; href?: string; icon: ReactNode; meta?: string; status?: string; title?: string }) {
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {heading}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {title ? (
          <div className="rounded-lg border border-border bg-background/35 p-3">
            {href ? <Link className="font-semibold hover:text-primary" href={href as never}>{title}</Link> : <p className="font-semibold">{title}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
            {status ? <Badge className="mt-3" variant="outline">{status}</Badge> : null}
          </div>
        ) : (
          <EmptyBox label={emptyLabel} />
        )}
      </CardContent>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background/35 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function EmptyBox({ label }: { label: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function RefundDetailSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28 rounded-lg" key={index} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ShadowSkeleton className="h-80 rounded-lg" />
        <ShadowSkeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

function customerName(refund: AdminRefundDetail) {
  const profile = refund.user?.profile;
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || refund.user?.email || "Customer";
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium" });
}
