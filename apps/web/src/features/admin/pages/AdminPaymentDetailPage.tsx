"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, FileText, ReceiptText, UserRound, WalletCards } from "lucide-react";
import type { ReactNode } from "react";

import { getAdminOverview, getAdminPaymentDetail, type AdminPaymentDetail } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { formatTomanMoney } from "@/shared/lib/toman-money";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminPaymentDetailPage({ paymentId }: { paymentId: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("payments.view"));
  const payment = useQuery({
    enabled: allowed,
    queryFn: () => getAdminPaymentDetail(paymentId),
    queryKey: ["admin-payment-detail", paymentId],
    retry: 1,
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <PaymentDetailSkeleton />
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
            <Badge className="w-fit" variant="outline">{t("Finance / Payments")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{payment.data?.paymentNumber ?? t("Payment detail")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Inspect gateway status, customer, related invoice/order, refunds, verification dates, and raw payment log timeline.")}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/admin/finance/payments" as never}>
              <ArrowRight className="size-4" />
              {t("Back to payments")}
            </Link>
          </Button>
        </section>

        {payment.isLoading ? <PaymentDetailSkeleton /> : null}

        {payment.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Payment unavailable")}</AlertTitle>
            <AlertDescription>{payment.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {payment.data ? <PaymentDetail payment={payment.data} /> : null}
      </div>
    </AdminShell>
  );
}

function PaymentDetail({ payment }: { payment: AdminPaymentDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={t("Status")} value={t(payment.status)} />
        <MetricCard label={t("Exact gateway amount")} value={formatTomanMoney(payment.amount, payment.currency, lang === "fa" ? "fa-IR" : "en-US")} />
        <MetricCard label={t("Payment purpose")} value={t(paymentPurposeLabel(payment.purpose))} />
        <MetricCard label={t("Gateway")} value={payment.gateway} />
        <MetricCard label={t("Created")} value={formatDate(payment.createdAt)} />
      </section>

      {payment.invoiceAmountMatches === false ? (
        <Alert variant="destructive"><AlertTitle>{t("Invoice amount mismatch")}</AlertTitle><AlertDescription>{t("The recorded gateway amount does not match the related invoice total and should be reviewed.")}</AlertDescription></Alert>
      ) : null}

      {payment.effectStatus === "MISSING" ? (
        <Alert variant="destructive"><AlertTitle>{t("Effect missing - review")}</AlertTitle><AlertDescription>{t("A paid transaction has no matching downstream effect and should be reviewed.")}</AlertDescription></Alert>
      ) : null}

      {payment.failureReason ? (
        <Alert variant="destructive">
          <AlertTitle>{t("Gateway failure")}</AlertTitle>
          <AlertDescription>{payment.failureReason}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              {t("Gateway details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <InfoBox label={t("Reference")} value={payment.referenceId ?? "-"} />
            <InfoBox label={t("Transaction")} value={payment.transactionId ?? "-"} />
            <InfoBox label={t("Authority")} value={payment.authority ?? "-"} />
            <InfoBox label={t("Card")} value={payment.cardPan ?? "-"} />
            <InfoBox label={t("Verified")} value={payment.verifiedAt ? formatDate(payment.verifiedAt) : t("Pending")} />
            <InfoBox label={t("Paid")} value={payment.paidAt ? formatDate(payment.paidAt) : t("Pending")} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5 text-primary" />
                {t("Customer")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine label={t("Name")} value={<AdminUserLink userId={payment.user?.id}>{customerName(payment)}</AdminUserLink>} />
              <InfoLine label={t("Email")} value={payment.user?.email ?? "-"} />
              <InfoLine label={t("Mobile")} value={formatMobileDisplay(payment.user?.mobile) || "-"} />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Related records")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {payment.order ? (
                <Button asChild className="w-full justify-between" variant="outline">
                  <Link href={`/admin/shop/orders/${payment.order.id}` as never}>{payment.order.orderNumber}<Badge variant="outline">{t(payment.order.status)}</Badge></Link>
                </Button>
              ) : null}
              {payment.invoice ? (
                <Button asChild className="w-full justify-between" variant="outline">
                  <Link href={`/admin/finance/invoices/${payment.invoice.id}` as never}>{payment.invoice.invoiceNumber}<Badge variant="outline">{t(payment.invoice.status)}</Badge></Link>
                </Button>
              ) : null}
              {payment.silverOrder ? (
                <Button asChild className="w-full justify-between" variant="outline"><Link href={`/admin/silver/orders/${payment.silverOrder.id}` as never}>{payment.silverOrder.orderNumber}<Badge variant="outline">{payment.silverOrder.grams} {t("grams")}</Badge></Link></Button>
              ) : null}
              {payment.walletTransaction ? (
                <Button asChild className="w-full justify-between" variant="outline"><Link href={`/admin/finance/wallet-transactions/${payment.walletTransaction.id}` as never}>{t("Wallet balance increase")}<Badge variant="outline">+ {formatTomanMoney(payment.walletTransaction.amount, "TOMAN", lang === "fa" ? "fa-IR" : "en-US")}</Badge></Link></Button>
              ) : null}
              {!payment.order && !payment.invoice && !payment.silverOrder && !payment.walletTransaction ? <p className="text-sm text-muted-foreground">{t("No related order or invoice.")}</p> : null}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="size-5 text-primary" />{t("Resulting financial effect")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine label={t("Status")} value={t(paymentEffectLabel(payment.effectStatus))} />
              {payment.walletTransaction ? <InfoLine label={t("Wallet balance after credit")} value={formatTomanMoney(payment.walletTransaction.balanceAfter, "TOMAN", lang === "fa" ? "fa-IR" : "en-US")} /> : null}
              {payment.silverOrder ? <InfoLine label={t("Silver credited")} value={`${payment.silverOrder.grams} ${t("grams")}`} /> : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {t("Payment logs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payment.logs.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Event")}</TableHead>
                    <TableHead>{t("Gateway")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Created")}</TableHead>
                    <TableHead>{t("Error")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{t(log.type)}</TableCell>
                      <TableCell>{log.gateway}</TableCell>
                      <TableCell><Badge variant="outline">{log.status ? t(log.status) : "-"}</Badge></TableCell>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">{log.error ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyBox label={t("No payment logs are attached.")} />
            )}
          </CardContent>
        </Card>

        <RecordList
          emptyLabel={t("No refunds have been logged.")}
          icon={<ReceiptText className="size-5 text-primary" />}
          items={payment.refunds.map((refund) => ({
            href: `/admin/finance/payments/refunds/${refund.id}`,
            meta: `${refund.amount} ${t(refund.currency)} · ${formatDate(refund.createdAt)}`,
            status: refund.status,
            title: refund.refundNumber,
          }))}
          title={t("Refunds")}
        />
      </section>
    </>
  );
}

function paymentPurposeLabel(purpose?: AdminPaymentDetail["purpose"]) {
  return ({ WALLET_TOP_UP: "Wallet top-up", SILVER_PURCHASE: "Direct silver purchase", PRODUCT_PURCHASE: "Product purchase", OTHER: "Other payment" } as const)[purpose ?? "OTHER"];
}

function paymentEffectLabel(status?: AdminPaymentDetail["effectStatus"]) {
  if (status === "APPLIED") return "Financial effect applied";
  if (status === "MISSING") return "Effect missing - review";
  if (status === "NOT_APPLICABLE") return "Not paid yet";
  return "Effect pending";
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
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
          <EmptyBox label={emptyLabel} />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyBox({ label }: { label: string }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function PaymentDetailSkeleton() {
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

function customerName(payment: AdminPaymentDetail) {
  const profile = payment.user?.profile;
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || payment.user?.email || "Customer";
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium" });
}
