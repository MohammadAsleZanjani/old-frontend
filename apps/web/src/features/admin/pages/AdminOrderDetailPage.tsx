"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, CreditCard, FileText, MapPin, PackageCheck, ReceiptText, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { getAdminOrderDetail, getAdminOverview, type AdminOrderDetail } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("orders.view"));
  const order = useQuery({
    enabled: allowed,
    queryFn: () => getAdminOrderDetail(orderId),
    queryKey: ["admin-order-detail", orderId],
    retry: 1,
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <OrderDetailSkeleton />
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
            <Badge className="w-fit" variant="outline">{t("Shop / Orders")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{order.data?.orderNumber ?? t("Order detail")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Review purchased items, order totals, payment activity, invoices, refunds, and fulfillment status.")}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/admin/shop/orders" as never}>
              <ArrowRight className="size-4" />
              {t("Back to orders")}
            </Link>
          </Button>
        </section>

        {order.isLoading ? <OrderDetailSkeleton /> : null}

        {order.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Order unavailable")}</AlertTitle>
            <AlertDescription>{order.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {order.data ? <OrderDetail order={order.data} /> : null}
      </div>
    </AdminShell>
  );
}

function OrderDetail({ order }: { order: AdminOrderDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const payment = order.payments[0];
  const user = order.user;
  const address = user?.addresses?.[0];
  const transactionAt = payment?.paidAt ?? payment?.verifiedAt ?? order.paidAt ?? payment?.createdAt ?? order.createdAt;
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Status")} value={t(order.status)} />
        <MetricCard label={t("Transaction amount")} value={formatMoney(order.total, order.currency, lang)} />
        <MetricCard label={t("Transaction type")} value={t("Physical product purchase")} />
        <MetricCard label={t("Exact transaction time")} value={formatDate(transactionAt)} />
      </section>

      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>{t("Operator review")}</AlertTitle>
        <AlertDescription>{t("Match the customer identity, payment references, delivery address, and order items before approving fulfillment.")}</AlertDescription>
      </Alert>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              {t("Customer information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {user ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/35 p-4">
                  <div>
                    <p className="font-semibold">{customerName(user)}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{user.id}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/users/${user.id}/edit` as never}>{t("User profile")}</Link>
                  </Button>
                </div>
                <AmountRow label={t("Mobile")} value={user.mobile ?? t("Not provided")} />
                <AmountRow label={t("Email")} value={user.email ?? t("Not provided")} />
                <AmountRow label={t("Account status")} value={t(user.status)} />
                <AmountRow label={t("Identity verification")} value={t(user.kycProfile?.status ?? "NOT_STARTED")} />
                <AmountRow label={t("National ID")} value={user.kycProfile?.nationalId ?? user.profile?.idCardNo ?? t("Not provided")} />
                <AmountRow label={t("Father name")} value={user.kycProfile?.fatherName ?? t("Not provided")} />
                <AmountRow label={t("Birth date")} value={user.kycProfile?.birthDateJalali ?? t("Not provided")} />
                <AmountRow label={t("Mobile verification")} value={user.mobileVerifiedAt ? formatDate(user.mobileVerifiedAt) : t("Not verified")} />
                <AmountRow label={t("Email verification")} value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : t("Not verified")} />
                <AmountRow label={t("Registration time")} value={formatDate(user.createdAt)} />
                <AmountRow label={t("Last login")} value={user.lastLoginAt ? formatDate(user.lastLoginAt) : t("Not provided")} />
                {address ? (
                  <div className="mt-4 rounded-lg border border-border bg-background/35 p-4">
                    <p className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" />{t("Delivery address")}</p>
                    <p className="mt-2 leading-7">{formatAddress(address)}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span>{t("Recipient")}: {address.recipient ?? customerName(user)}</span>
                      <span dir="ltr">{address.phone ?? user.mobile ?? "—"}</span>
                      <span>{t("Postal code")}: {address.postalCode ?? "—"}</span>
                    </div>
                  </div>
                ) : <EmptyBox label={t("No delivery address is attached.")} />}
              </>
            ) : <EmptyBox label={t("No customer is attached to this order.")} />}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              {t("Transaction details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {payment ? (
              <>
                <AmountRow label={t("Payment method")} value={paymentGatewayLabel(payment.gateway, t)} />
                <AmountRow label={t("Transaction amount")} strong value={formatMoney(payment.amount, payment.currency, lang)} />
                <AmountRow label={t("Payment status")} value={t(payment.status)} />
                <AmountRow label={t("Payment number")} value={payment.paymentNumber} />
                <AmountRow label={t("Reference")} value={payment.referenceId ?? t("Not provided")} />
                <AmountRow label={t("Transaction")} value={payment.transactionId ?? t("Not provided")} />
                <AmountRow label={t("Authority")} value={payment.authority ?? t("Not provided")} />
                <AmountRow label={t("Card number")} value={payment.cardPan ?? t("Not provided")} />
                {metadataValue(payment.metadata, "silverPaymentGrams") ? <AmountRow label={t("Silver paid")} value={`${metadataValue(payment.metadata, "silverPaymentGrams")} ${t("gram")}`} /> : null}
                <AmountRow label={t("Created")} value={formatDate(payment.createdAt)} />
                <AmountRow label={t("Paid")} value={payment.paidAt ? formatDate(payment.paidAt) : t("Pending")} />
                <AmountRow label={t("Verified")} value={payment.verifiedAt ? formatDate(payment.verifiedAt) : t("Pending")} />
                {payment.failureReason ? <p className="rounded-lg bg-destructive/10 p-3 text-destructive">{payment.failureReason}</p> : null}
                {payment.logs?.length ? (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <p className="font-semibold">{t("Payment event history")}</p>
                    {payment.logs.map((log) => (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/35 px-3 py-2" key={log.id}>
                        <span>{t(log.type)} · {t(log.status ?? "PENDING")}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                        {log.error ? <span className="w-full text-xs text-destructive">{log.error}</span> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : <EmptyBox label={t("No payment is attached to this order.")} />}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="size-5 text-primary" />
              {t("Order items")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Product")}</TableHead>
                    <TableHead>{t("SKU / inventory code")}</TableHead>
                    <TableHead>{t("Qty")}</TableHead>
                    <TableHead>{t("Unit")}</TableHead>
                    <TableHead>{t("Total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product?.slug ? (
                          <Link className="hover:text-primary" href={`/products/${item.product.slug}` as never}>{item.title}</Link>
                        ) : item.title}
                        {metadataValue(item.metadata, "weightGrams") ? <p className="mt-1 text-xs text-muted-foreground">{metadataValue(item.metadata, "weightGrams")} {t("gram")}</p> : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs" dir="ltr">{item.sku ?? "—"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatMoney(item.unitPrice, item.currency, lang)}</TableCell>
                      <TableCell>{formatMoney(item.total, item.currency, lang)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyBox label={t("No order items are attached.")} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Totals")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AmountRow label={t("Subtotal")} value={formatMoney(order.subtotal, order.currency, lang)} />
              <AmountRow label={t("Discount")} value={formatMoney(order.discount, order.currency, lang)} />
              <AmountRow label={t("Tax")} value={formatMoney(order.tax, order.currency, lang)} />
              <AmountRow label={t("Total")} strong value={formatMoney(order.total, order.currency, lang)} />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle>{t("Fulfillment information")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AmountRow label={t("Delivery units")} value={metadataValue(order.metadata, "deliveryUnitCount") ?? String(order.items.reduce((total, item) => total + item.quantity, 0))} />
              <AmountRow label={t("Delivery fee")} value={formatMoney(metadataValue(order.metadata, "deliveryFeeToman") ?? "0", "TOMAN", lang)} />
              <AmountRow label={t("Delivery fee in silver")} value={`${metadataValue(order.metadata, "deliveryFeeGrams") ?? "0"} ${t("gram")}`} />
              <AmountRow label={t("Delivery fee source")} value={deliverySourceLabel(metadataValue(order.metadata, "deliveryFeeSource"), t)} />
              <AmountRow label={t("Pricing mode")} value={t(metadataValue(order.metadata, "pricingMode") ?? "Not provided")} />
              {order.notes ? <div className="rounded-lg bg-background/35 p-3"><p className="text-muted-foreground">{t("Order note")}</p><p className="mt-1 leading-6">{order.notes}</p></div> : null}
            </CardContent>
          </Card>

          {order.promotionRedemption ? (
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader><CardTitle>{t("Promotion code")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <AmountRow label={t("Code")} value={order.promotionRedemption.code} />
                <AmountRow label={t("Reward")} value={t(order.promotionRedemption.rewardType.replaceAll("_", " "))} />
                <AmountRow label={t("Status")} value={t(order.promotionRedemption.status)} />
                {Number(order.promotionRedemption.walletCreditAmount) > 0 ? <AmountRow label={t("Wallet credit")} value={order.promotionRedemption.walletCreditAmount} /> : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Timeline")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <AmountRow label={t("Created")} value={formatDate(order.createdAt)} />
              <AmountRow label={t("Updated")} value={formatDate(order.updatedAt)} />
              <AmountRow label={t("Paid")} value={order.paidAt ? formatDate(order.paidAt) : t("Pending")} />
              <AmountRow label={t("Completed")} value={order.completedAt ? formatDate(order.completedAt) : t("Pending")} />
              <AmountRow label={t("Cancelled")} value={order.cancelledAt ? formatDate(order.cancelledAt) : t("No")} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RecordList
          emptyLabel="No invoices have been issued."
          icon={<FileText className="size-5 text-primary" />}
          items={order.invoices.map((invoice) => ({
            href: `/admin/finance/invoices/${invoice.id}`,
            meta: `${formatMoney(invoice.total, invoice.currency, lang)} · ${t("Due")} ${formatMoney(invoice.balanceDue, invoice.currency, lang)} · ${formatDate(invoice.createdAt)}`,
            status: invoice.status,
            title: invoice.invoiceNumber,
          }))}
          title="Invoices"
        />
        <RecordList
          emptyLabel="No payments have been logged."
          icon={<CreditCard className="size-5 text-primary" />}
          items={order.payments.map((payment) => ({
            href: `/admin/finance/payments/${payment.id}`,
            meta: `${formatMoney(payment.amount, payment.currency, lang)} · ${paymentGatewayLabel(payment.gateway, t)} · ${formatDate(payment.paidAt ?? payment.createdAt)}`,
            status: payment.status,
            title: payment.paymentNumber,
          }))}
          title="Payments"
        />
        <RecordList
          emptyLabel="No refunds have been logged."
          icon={<ReceiptText className="size-5 text-primary" />}
          items={order.refunds.map((refund) => ({
            href: `/admin/finance/payments/refunds/${refund.id}`,
            meta: `${formatMoney(refund.amount, refund.currency, lang)} · ${formatDate(refund.createdAt)}`,
            status: refund.status,
            title: refund.refundNumber,
          }))}
          title="Refunds"
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
        <div className="text-xl font-bold leading-8 md:text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}

function AmountRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-background/35 px-3 py-2">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className="break-all text-end font-semibold">{value}</span>
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

function OrderDetailSkeleton() {
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
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "medium" });
}

type AdminOrderUser = NonNullable<AdminOrderDetail["user"]>;
type AdminOrderAddress = NonNullable<AdminOrderUser["addresses"]>[number];

function customerName(user: AdminOrderUser) {
  const profileName = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ");
  return profileName || user.profile?.displayName || user.kycProfile?.fullName || user.mobile || user.email || "کاربر بدون نام";
}

function formatAddress(address: AdminOrderAddress) {
  return [address.country, address.province, address.city, address.line1, address.line2].filter(Boolean).join("، ");
}

function formatMoney(value: string, currency: string, lang: string) {
  if (isTomanCurrency(currency)) return formatTomanMoney(value, currency, lang === "fa" ? "fa-IR" : "en-US");
  const numeric = Number(value);
  const amount = Number.isFinite(numeric) ? numeric.toLocaleString(lang === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 3 }) : value;
  return `${amount} ${translateUiText(currency, lang)}`;
}

function metadataValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}

function paymentGatewayLabel(gateway: string, t: (text: string) => string) {
  if (gateway === "zarinpal") return t("Zarinpal");
  if (gateway === "wallet") return t("Toman wallet");
  if (gateway === "silver-wallet") return t("Silver wallet");
  return gateway || t("Not provided");
}

function deliverySourceLabel(source: string | undefined, t: (text: string) => string) {
  if (source === "SILVER_WALLET") return t("Paid from silver wallet");
  if (source === "TOMAN_WALLET") return t("Paid from toman wallet");
  if (source === "ORDER_PAYMENT") return t("Added to order payment");
  if (source === "NONE") return t("No delivery fee");
  return t("Not provided");
}
