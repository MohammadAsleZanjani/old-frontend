"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Copy, CreditCard, Download, ExternalLink, Eye, FileText, LifeBuoy, Loader2, PackageCheck, ReceiptText, RefreshCw, ShoppingBag, Ticket, Wallet } from "lucide-react";
import { useEffect } from "react";
import { toast } from "@/shared/ui/sonner";

import {
  downloadCustomerInvoicePdf,
  getCustomerDashboardOverview,
  getCustomerInvoiceDetail,
  getCustomerOrderDetail,
  getCustomerPaymentDetail,
  requestCustomerPayment,
  type CustomerInvoiceDetail,
  type CustomerOrderDetail,
  type CustomerPaymentDetail,
} from "@/features/customer-dashboard/api/customer-dashboard-api";
import { CustomerActivityPanel, CustomerAssetsPanel, CustomerCommercePanel, CustomerFavoritesPanel, CustomerHelpPanel, CustomerLiveChatPanel, CustomerNotificationsPanel, CustomerProfilePanel, CustomerReferralPanel, CustomerSupportTicketsPanel } from "@/features/customer-dashboard/pages/CustomerActionPanels";
import { CustomerDashboardShell } from "@/features/customer-dashboard/components/CustomerDashboardShell";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";
import { findCustomerDashboardItem } from "@/features/customer-dashboard/config/customer-dashboard-navigation";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const kpiIcons = [ShoppingBag, ReceiptText, Wallet, Download, PackageCheck, LifeBuoy, Ticket, FileText];

export function CustomerDashboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: authLoading, user } = useAuth();
  const { lang } = useI18n();
  const activeItem = findCustomerDashboardItem(pathname);
  const selectedOrderId = detailIdFromPath(pathname, "orders");
  const selectedInvoiceId = detailIdFromPath(pathname, "invoices");
  const selectedPaymentId = detailIdFromPath(pathname, "payments");
  const selectedTicketId = ticketIdFromPath(pathname);
  const selectedLiveChatId = liveChatIdFromPath(pathname);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authLoading, pathname, router, user]);

  const overview = useQuery({
    enabled: Boolean(user),
    queryFn: () => getCustomerDashboardOverview(),
    queryKey: ["customer-dashboard-overview"],
    retry: 1,
  });
  const selectedOrder = useQuery({
    enabled: Boolean(user && selectedOrderId),
    queryFn: () => getCustomerOrderDetail(selectedOrderId ?? ""),
    queryKey: ["customer-order-detail", selectedOrderId],
    retry: 1,
  });
  const selectedInvoice = useQuery({
    enabled: Boolean(user && selectedInvoiceId),
    queryFn: () => getCustomerInvoiceDetail(selectedInvoiceId ?? ""),
    queryKey: ["customer-invoice-detail", selectedInvoiceId],
    retry: 1,
  });
  const selectedPayment = useQuery({
    enabled: Boolean(user && selectedPaymentId),
    queryFn: () => getCustomerPaymentDetail(selectedPaymentId ?? ""),
    queryKey: ["customer-payment-detail", selectedPaymentId],
    retry: 1,
  });

  if (authLoading || !user || overview.isLoading) {
    return (
      <CustomerDashboardShell>
        <DashboardSkeleton />
      </CustomerDashboardShell>
    );
  }

  if (overview.isError) {
    return (
      <CustomerDashboardShell>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{translateUiText("Dashboard unavailable", lang)}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </CustomerDashboardShell>
    );
  }

  const data = overview.data;
  if (!data) {
    return (
      <CustomerDashboardShell>
        <DashboardSkeleton />
      </CustomerDashboardShell>
    );
  }

  const isOverview = pathname === "/user";
  const rows = normalizeData(data);
  const isNotificationsRoute = pathname.startsWith("/user/notifications");
  const isReferralRoute = pathname.startsWith("/user/referrals");
  const isSupportTicketsRoute = pathname.startsWith("/user/support/tickets");
  const isLiveChatRoute = pathname.startsWith("/user/support/live-chat");
  const isOrdersRoute = pathname.startsWith("/user/orders") && !selectedOrderId;
  const isInvoicesRoute = pathname.startsWith("/user/invoices") && !selectedInvoiceId;
  const isPaymentsRoute = (pathname.startsWith("/user/payments") || pathname.startsWith("/user/wallet")) && !selectedPaymentId;
  const isPurchasesRoute = pathname.startsWith("/user/purchases");
  const isDownloadsRoute = pathname.startsWith("/user/downloads");
  const isLicensesRoute = pathname.startsWith("/user/licenses");
  const isReviewsRoute = pathname.startsWith("/user/activity/reviews") || pathname === "/user/activity";
  const isQuestionsRoute = pathname.startsWith("/user/activity/questions") || pathname.startsWith("/user/activity/answers");
  const isFavoritesRoute = pathname.startsWith("/user/favorites") || pathname.startsWith("/user/purchases/saved");
  const isRecentlyViewedRoute = pathname.startsWith("/user/activity/recently-viewed");
  const isHelpRoute = pathname.startsWith("/user/support/help");
  const isAccountRoute = pathname.startsWith("/user/account") || pathname.startsWith("/user/settings");
  const hasActionPanel = isNotificationsRoute || isReferralRoute || isSupportTicketsRoute || isLiveChatRoute || isOrdersRoute || isInvoicesRoute || isPaymentsRoute || isPurchasesRoute || isDownloadsRoute || isLicensesRoute || isReviewsRoute || isQuestionsRoute || isFavoritesRoute || isRecentlyViewedRoute || isHelpRoute || isAccountRoute;
  const commerceStatus = commerceStatusFromPath(pathname);
  const invoiceView = invoiceViewFromPath(pathname);
  const paymentView = paymentViewFromPath(pathname);

  return (
    <CustomerDashboardShell>
      <div className="space-y-5">
        <section className="rounded-2xl border border-border glass p-6 shadow-[0_22px_70px_-48px_var(--glow)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3" variant="outline">
                {translateUiText(data.profile.status ?? "ACTIVE", lang)}
              </Badge>
              <h2 className="text-2xl font-black md:text-3xl">
                {isOverview ? `${translateUiText("Welcome", lang)}, ${data.profile.name}` : translateUiText(activeItem.label, lang)}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {translateUiText(isOverview ? "Your orders, downloads, invoices, referrals, support, live chat, notifications, and account security are connected here." : activeItem.description, lang)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={"/products" as never}>{translateUiText("Browse products", lang)}</Link>
              </Button>
              <Button asChild>
                <Link href={"/user/support/tickets" as never}>{translateUiText("Open ticket", lang)}</Link>
              </Button>
            </div>
          </div>
        </section>

        {isOverview ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.kpis.map((kpi, index) => {
              const Icon = kpiIcons[index % kpiIcons.length];
              return (
                <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={kpi.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{translateUiText(kpi.label, lang)}</CardTitle>
                    <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="size-4" />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{formatNumber(kpi.value)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{translateUiText(kpi.meta, lang)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        ) : null}

        {selectedOrderId ? (
          <OrderDetailCard error={selectedOrder.error} loading={selectedOrder.isLoading} order={selectedOrder.data} />
        ) : null}

        {selectedInvoiceId ? (
          <InvoiceDetailCard error={selectedInvoice.error} invoice={selectedInvoice.data} loading={selectedInvoice.isLoading} />
        ) : null}

        {selectedPaymentId ? (
          <PaymentDetailCard error={selectedPayment.error} loading={selectedPayment.isLoading} payment={selectedPayment.data} />
        ) : null}

        {isNotificationsRoute ? <CustomerNotificationsPanel pathname={pathname} /> : null}
        {isReferralRoute ? <CustomerReferralPanel pathname={pathname} /> : null}
        {isSupportTicketsRoute ? <CustomerSupportTicketsPanel isOpenRoute={pathname.endsWith("/open")} selectedTicketId={selectedTicketId} /> : null}
        {isLiveChatRoute ? <CustomerLiveChatPanel selectedConversationId={selectedLiveChatId} /> : null}
        {isOrdersRoute ? <CustomerCommercePanel initialStatus={commerceStatus} mode="orders" title={translateUiText(activeItem.label, lang)} /> : null}
        {isInvoicesRoute ? <CustomerCommercePanel initialStatus={commerceStatus} invoiceView={invoiceView} mode="invoices" title={translateUiText(activeItem.label, lang)} /> : null}
        {isPaymentsRoute ? <CustomerCommercePanel initialStatus={commerceStatus} mode="payments" paymentView={paymentView} title={translateUiText(activeItem.label, lang)} /> : null}
        {isPurchasesRoute && pathname.startsWith("/user/purchases/updates") ? <CustomerAssetsPanel mode="purchases" title={translateUiText("Product Updates", lang)} variant="updates" /> : null}
        {isPurchasesRoute && !pathname.startsWith("/user/purchases/updates") && !pathname.startsWith("/user/purchases/saved") ? <CustomerAssetsPanel mode="purchases" /> : null}
        {isDownloadsRoute ? <CustomerAssetsPanel mode="downloads" /> : null}
        {isLicensesRoute ? <CustomerAssetsPanel mode="licenses" /> : null}
        {isReviewsRoute ? <CustomerActivityPanel mode="reviews" /> : null}
        {isQuestionsRoute ? <CustomerActivityPanel mode="questions" /> : null}
        {isFavoritesRoute ? <CustomerFavoritesPanel kind={favoriteKindFromPath(pathname)} mode="saved" title={favoriteTitleFromPath(pathname)} /> : null}
        {isRecentlyViewedRoute ? <CustomerFavoritesPanel mode="recent" /> : null}
        {isHelpRoute ? <CustomerHelpPanel pathname={pathname} /> : null}
        {isAccountRoute ? <CustomerProfilePanel pathname={pathname} /> : null}

        {!hasActionPanel ? <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isOverview ? translateUiText("Recent Orders", lang) : `${translateUiText(activeItem.label, lang)} ${translateUiText("Records", lang)}`}</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={viewAllHref(pathname) as never}>
                  <Eye className="size-4" />
                  {translateUiText("View all", lang)}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <RecentTable rows={rowsFor(pathname, rows)} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader>
                <CardTitle>{translateUiText("Account Alerts", lang)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.map((alert) => (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background/35 p-3" key={alert.label}>
                    <div>
                      <p className="text-sm font-semibold">{translateUiText(alert.label, lang)}</p>
                      <p className="text-xs text-muted-foreground">{translateUiText(alert.severity, lang)}</p>
                    </div>
                    <Badge className={alert.severity === "critical" ? "bg-destructive text-destructive-foreground" : ""} variant="outline">
                      {alert.value}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader>
                <CardTitle>{translateUiText("Referral Program", lang)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.referral ? (
                  <>
                    <div className="flex items-center justify-between rounded-xl bg-background/35 px-3 py-2">
                      <span className="text-muted-foreground">{translateUiText("Code", lang)}</span>
                      <span className="font-mono font-semibold">{data.referral.code}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-background/35 px-3 py-2">
                      <span className="text-muted-foreground">{translateUiText("Balance", lang)}</span>
                      <span className="font-semibold">{formatInvoiceMoney(String(data.referral.balance), data.referral.currency)}</span>
                    </div>
                  </>
                ) : (
                  <p className="leading-7 text-muted-foreground">{translateUiText("Referral account is created when you open the referral dashboard.", lang)}</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader>
                <CardTitle>{translateUiText("Notifications", lang)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.notifications.length ? data.notifications.map((item) => (
                  <div className="rounded-xl border border-border bg-background/35 p-3" key={item.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <Badge variant="outline">{translateUiText(item.status, lang)}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.body}</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">{translateUiText("No notifications yet.", lang)}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section> : null}
      </div>
    </CustomerDashboardShell>
  );
}

function OrderDetailCard({ error, loading, order }: { error: Error | null; loading: boolean; order?: CustomerOrderDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const router = useRouter();
  const payOrder = useMutation({
    mutationFn: async (invoiceId: string) => requestCustomerPayment(invoiceId),
    onError: (err) => toast.error(err instanceof Error ? err.message : t("Payment request failed")),
    onSuccess: (payment) => {
      toast.success(t("Payment request is ready."));
      void queryClient.invalidateQueries({ queryKey: ["customer-order-detail", order?.id] });
      void queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      if (payment.paymentUrl) {
        if (payment.paymentUrl.startsWith("http")) window.location.assign(payment.paymentUrl);
        else router.push(payment.paymentUrl as never);
      }
    },
  });
  const downloadLatestInvoice = useMutation({
    mutationFn: async (invoiceId: string) => downloadCustomerInvoicePdf(invoiceId),
    onError: (err) => toast.error(err instanceof Error ? err.message : t("Invoice PDF download failed")),
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

  if (loading) return <ShadowSkeleton className="h-64 rounded-2xl" />;
  if (error) return <DetailError message={error.message} title="Order unavailable" />;
  if (!order) return null;
  const payableInvoice = order.invoices.find((invoice) => Number(invoice.balanceDue) > 0 && !["PAID", "CANCELLED", "VOID"].includes(invoice.status));
  const latestInvoice = order.invoices.at(0);
  const paidPayments = order.payments.filter((payment) => payment.status === "PAID");
  const progress = orderProgress(order.status, payableInvoice ? "PAYMENT" : paidPayments.length ? "FULFILLMENT" : "REVIEW");
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-xl">{t("Order")} {order.orderNumber}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{order.items.length} {t("items")} · {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{t(order.status)}</Badge>
          {payableInvoice ? (
            <Button disabled={payOrder.isPending} onClick={() => payOrder.mutate(payableInvoice.id)} size="sm">
              {payOrder.isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              {t("Pay order")}
            </Button>
          ) : null}
          {latestInvoice ? (
            <Button disabled={downloadLatestInvoice.isPending} onClick={() => downloadLatestInvoice.mutate(latestInvoice.id)} size="sm" variant="outline">
              {downloadLatestInvoice.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {t("Invoice PDF")}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <PaymentStat label="Total" value={formatInvoiceMoney(order.total, order.currency)} />
          <PaymentStat label="Invoices" value={String(order.invoices.length)} />
          <PaymentStat label="Payments" value={String(order.payments.length)} />
          <PaymentStat label="Refunds" value={String(order.refunds.length)} />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <p className="text-sm font-semibold">{translateUiText("Order progress", lang)}</p>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              {progress.map((step) => (
                <div className={step.done ? "rounded-xl border border-primary/40 bg-primary/10 p-3" : "rounded-xl border border-border bg-background/45 p-3"} key={step.label}>
                  <p className="text-xs text-muted-foreground">{t(step.label)}</p>
                  <p className="mt-1 text-sm font-semibold">{t(step.value)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{t(orderNextStep(order.status))}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <p className="text-sm font-semibold">{translateUiText("Order actions", lang)}</p>
            <div className="mt-3 space-y-2">
              {payableInvoice ? (
                <Button className="w-full justify-between" disabled={payOrder.isPending} onClick={() => payOrder.mutate(payableInvoice.id)}>
                  {payOrder.isPending ? t("Preparing payment") : `${t("Pay")} ${payableInvoice.invoiceNumber}`}
                  {payOrder.isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                </Button>
              ) : null}
              <Button asChild className="w-full justify-between" variant="outline">
                <Link href={`/user/support/tickets/open?order=${encodeURIComponent(order.id)}` as never}>
                  {t("Contact support")}
                  <LifeBuoy className="size-4" />
                </Link>
              </Button>
              <Button onClick={() => copyToClipboard(order.orderNumber, t("Order number copied."))} className="w-full justify-between" variant="outline">
                {t("Copy order number")}
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <DetailList
          emptyLabel="No order items are attached."
          items={order.items.map((item) => ({
            href: item.product?.slug ? `/products/${item.product.slug}` : undefined,
            meta: `${item.quantity} x ${formatInvoiceMoney(item.unitPrice, item.currency)}`,
            status: formatInvoiceMoney(item.total, item.currency),
            title: item.title,
          }))}
          title="Purchased items"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <DetailList
            emptyLabel="No invoices yet."
            items={order.invoices.map((invoice) => ({
              href: `/user/invoices/${invoice.id}`,
              meta: formatInvoiceMoney(invoice.total, invoice.currency),
              status: invoice.status,
              title: invoice.invoiceNumber,
            }))}
            title="Invoices"
          />
          <DetailList
            emptyLabel="No payments yet."
            items={order.payments.map((payment) => ({
              href: `/user/payments/${payment.id}`,
              meta: formatInvoiceMoney(payment.amount, payment.currency),
              status: payment.status,
              title: payment.paymentNumber,
            }))}
            title="Payments"
          />
        </div>
        <DetailList
          emptyLabel="No refunds yet."
          items={order.refunds.map((refund) => ({
            meta: formatInvoiceMoney(refund.amount, refund.currency),
            status: refund.status,
            title: refund.refundNumber,
          }))}
          title="Refunds"
        />
      </CardContent>
    </Card>
  );
}

function InvoiceDetailCard({ error, invoice, loading }: { error: Error | null; invoice?: CustomerInvoiceDetail; loading: boolean }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const router = useRouter();
  const downloadPdf = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error(t("Invoice is not loaded"));
      return downloadCustomerInvoicePdf(invoice.id);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("Invoice PDF download failed")),
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
  const payInvoice = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error(t("Invoice is not loaded"));
      return requestCustomerPayment(invoice.id);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("Payment request failed")),
    onSuccess: (payment) => {
      toast.success(t("Payment request is ready."));
      void queryClient.invalidateQueries({ queryKey: ["customer-invoice-detail", invoice?.id] });
      void queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      if (payment.paymentUrl) {
        if (payment.paymentUrl.startsWith("http")) window.location.assign(payment.paymentUrl);
        else router.push(payment.paymentUrl as never);
      }
    },
  });

  if (loading) return <ShadowSkeleton className="h-64 rounded-2xl" />;
  if (error) return <DetailError message={error.message} title="Invoice unavailable" />;
  if (!invoice) return null;
  const payable = Number(invoice.balanceDue) > 0 && !["PAID", "CANCELLED", "VOID"].includes(invoice.status);
  const paidTotal = Math.max(0, Number(invoice.total) - Number(invoice.balanceDue));
  const customer = invoice.user;
  const address = customer?.addresses?.[0];
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-xl">{t("Invoice")} {invoice.invoiceNumber}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.order?.orderNumber ?? t("Custom invoice")} · {invoice.dueAt ? `${t("Due")} ${formatDate(invoice.dueAt)}` : t("No due date")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{t(invoice.status)}</Badge>
          <Button disabled={payInvoice.isPending || !payable} onClick={() => payInvoice.mutate()} size="sm">
            {payInvoice.isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            {t("Pay invoice")}
          </Button>
          <Button disabled={downloadPdf.isPending} onClick={() => downloadPdf.mutate()} size="sm" variant="outline">
            {downloadPdf.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {t("Download PDF")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <PaymentStat label="Total" value={formatInvoiceMoney(invoice.total, invoice.currency)} />
          <PaymentStat label="Balance due" value={formatInvoiceMoney(invoice.balanceDue, invoice.currency)} />
          <PaymentStat label="Paid amount" value={formatInvoiceMoney(paidTotal.toFixed(2), invoice.currency)} />
          <PaymentStat label="Payments" value={String(invoice.payments.length)} />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <p className="text-sm font-semibold">{translateUiText("Billing details", lang)}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <InvoiceInfo emptyLabel={translateUiText("Not provided", lang)} label={translateUiText("Name and last name", lang)} value={formatInvoiceCustomerName(customer)} />
              <InvoiceInfo emptyLabel={translateUiText("Not provided", lang)} label={translateUiText("Mobile", lang)} value={formatMobileDisplay(customer?.mobile)} />
              <InvoiceInfo emptyLabel={translateUiText("Not provided", lang)} label={translateUiText("Email", lang)} value={customer?.email ?? customer?.companyProfile?.billingEmail} />
              <InvoiceInfo emptyLabel={translateUiText("Not provided", lang)} label={translateUiText("ID / National no.", lang)} value={customer?.profile?.idCardNo} />
            </div>
            <InvoiceInfo className="mt-2" emptyLabel={translateUiText("Not provided", lang)} label={translateUiText("Address", lang)} value={formatInvoiceAddress(address)} />
          </div>
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <p className="text-sm font-semibold">{translateUiText("Price details", lang)}</p>
            <div className="mt-3 space-y-2">
              <PriceLine label={translateUiText("Subtotal", lang)} value={formatInvoiceMoney(invoice.subtotal, invoice.currency)} />
              <PriceLine label={translateUiText("Discount", lang)} value={formatInvoiceMoney(invoice.discount ?? "0", invoice.currency)} />
              <PriceLine label={translateUiText("Tax", lang)} value={formatInvoiceMoney(invoice.tax ?? "0", invoice.currency)} />
              <PriceLine label={translateUiText("Total price", lang)} strong value={formatInvoiceMoney(invoice.total, invoice.currency)} />
              <PriceLine label={translateUiText("Balance due", lang)} strong value={formatInvoiceMoney(invoice.balanceDue, invoice.currency)} />
            </div>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <p className="text-sm font-semibold">{translateUiText("Invoice status", lang)}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {invoice.paidAt ? `${t("Paid on")} ${formatDate(invoice.paidAt)}.` : payable ? t("This invoice is ready for payment. Starting payment reuses any existing pending payment request.") : t("No payment is required for this invoice.")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {payable ? (
                <Button disabled={payInvoice.isPending} onClick={() => payInvoice.mutate()}>
                  {payInvoice.isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  {t("Start payment")}
                </Button>
              ) : null}
              <Button onClick={() => copyToClipboard(invoice.invoiceNumber, t("Invoice number copied."))} variant="outline">
                <Copy className="size-4" />
                {t("Copy invoice number")}
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <p className="text-sm font-semibold">{translateUiText("Related actions", lang)}</p>
            <div className="mt-3 space-y-2">
              {invoice.order ? (
                <Button asChild className="w-full justify-between" variant="outline">
                  <Link href={`/user/orders/${invoice.order.id}` as never}>
                    {invoice.order.orderNumber}
                    <ShoppingBag className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild className="w-full justify-between" variant="outline">
                <Link href={"/user/payments/refunds" as never}>
                  {t("Refund center")}
                  <RefreshCw className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <DetailList
          emptyLabel="No invoice items are attached."
          items={invoice.items.map((item) => ({
            meta: `${item.quantity} x ${formatInvoiceMoney(item.unitPrice, item.currency)}`,
            status: formatInvoiceMoney(item.total, item.currency),
            title: item.description,
          }))}
          title="Invoice items"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <DetailList
            emptyLabel="No payments yet."
            items={invoice.payments.map((payment) => ({
              href: `/user/payments/${payment.id}`,
              meta: formatInvoiceMoney(payment.amount, payment.currency),
              status: payment.status,
              title: payment.paymentNumber,
            }))}
            title="Payments"
          />
          <DetailList
            emptyLabel="No refunds yet."
            items={invoice.refunds.map((refund) => ({
              meta: formatInvoiceMoney(refund.amount, refund.currency),
              status: refund.status,
              title: refund.refundNumber,
            }))}
            title="Refunds"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentDetailCard({ error, loading, payment }: { error: Error | null; loading: boolean; payment?: CustomerPaymentDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const refreshPayment = useMutation({
    mutationFn: async () => {
      if (!payment?.invoice?.id) throw new Error(t("Payment invoice is not available"));
      return requestCustomerPayment(payment.invoice.id);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("Payment link could not be refreshed")),
    onSuccess: (result) => {
      toast.success(t("Payment link is ready."));
      void queryClient.invalidateQueries({ queryKey: ["customer-payment-detail", payment?.id] });
      void queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      if (result.paymentUrl?.startsWith("http")) window.location.assign(result.paymentUrl);
    },
  });

  if (loading) return <ShadowSkeleton className="h-56 rounded-2xl" />;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>{translateUiText("Payment unavailable", lang)}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!payment) return null;
  const latestLog = payment.logs.at(-1);
  const selfPaymentUrl = `/user/payments/${payment.id}`;
  const hasExternalPaymentUrl = Boolean(payment.paymentUrl?.startsWith("http"));
  const hasSelfPaymentUrl = payment.paymentUrl === selfPaymentUrl;
  const canRefreshPayment = payment.invoice?.id && !["PAID", "CANCELLED"].includes(payment.status);
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-xl">{t("Payment")} {payment.paymentNumber}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {payment.order?.orderNumber ?? t("Order pending")} · {payment.invoice?.invoiceNumber ?? t("Invoice pending")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{payment.gateway}</Badge>
          <Badge variant="outline">{t(payment.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <PaymentStat label="Amount" value={formatInvoiceMoney(payment.amount, payment.currency)} />
          <PaymentStat label="Invoice" value={payment.invoice?.status ?? "PENDING"} />
          <PaymentStat label="Order" value={payment.order?.status ?? "PENDING"} />
          <PaymentStat label="Created" value={formatDate(payment.createdAt)} />
        </div>
        {payment.failureReason ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{translateUiText("Payment failed", lang)}</AlertTitle>
            <AlertDescription>{payment.failureReason}</AlertDescription>
          </Alert>
        ) : null}
        {payment.gateway === "manual" && payment.status !== "PAID" ? (
          <Alert>
            <CreditCard className="size-4" />
            <AlertTitle>{translateUiText("Manual payment pending", lang)}</AlertTitle>
            <AlertDescription>
              {t("Use this payment number for bank transfer or finance confirmation. The payment will move to paid after staff verification.")}
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold">{translateUiText("Payment actions", lang)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {latestLog ? `${t(latestLog.type)} · ${t(latestLog.status ?? payment.status)} · ${formatDate(latestLog.createdAt)}` : t("No gateway events yet.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasExternalPaymentUrl ? (
                  <Button asChild>
                    <a href={payment.paymentUrl ?? undefined}>
                      <ExternalLink className="size-4" />
                      {t("Open gateway")}
                    </a>
                  </Button>
                ) : null}
                {canRefreshPayment ? (
                  <Button disabled={refreshPayment.isPending} onClick={() => refreshPayment.mutate()} variant={hasExternalPaymentUrl ? "outline" : "default"}>
                    {refreshPayment.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    {hasSelfPaymentUrl ? t("Refresh instructions") : t("Refresh payment link")}
                  </Button>
                ) : null}
                <Button onClick={() => copyToClipboard(payment.paymentNumber, t("Payment number copied."))} variant="outline">
                  <Copy className="size-4" />
                  {t("Copy number")}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <PaymentStat label="Reference" value={payment.referenceId ?? "-"} />
              <PaymentStat label="Transaction" value={payment.transactionId ?? "-"} />
              <PaymentStat label="Verified" value={payment.verifiedAt ? formatDate(payment.verifiedAt) : "-"} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/35 p-3">
            <p className="text-sm font-semibold">{translateUiText("Related records", lang)}</p>
            <div className="mt-3 space-y-2">
              {payment.invoice ? (
                <Button asChild className="w-full justify-between" variant="outline">
                  <Link href={`/user/invoices/${payment.invoice.id}` as never}>
                    {payment.invoice.invoiceNumber}
                    <ReceiptText className="size-4" />
                  </Link>
                </Button>
              ) : null}
              {payment.order ? (
                <Button asChild className="w-full justify-between" variant="outline">
                  <Link href={`/user/orders/${payment.order.id}` as never}>
                    {payment.order.orderNumber}
                    <ShoppingBag className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild className="w-full justify-between" variant="outline">
                <Link href={"/user/payments" as never}>
                  {t("Back to payments")}
                  <Wallet className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/35 p-3">
          <p className="text-sm font-semibold">{translateUiText("Gateway timeline", lang)}</p>
          <div className="mt-3 space-y-2">
            {payment.logs.length ? payment.logs.map((log) => (
              <div className="flex flex-col gap-1 rounded-lg bg-background/45 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between" key={log.id}>
                <div>
                  <p className="font-semibold">{t(log.type)}</p>
                  <p className="text-xs text-muted-foreground">{log.gateway} · {formatDate(log.createdAt)}</p>
                </div>
                <Badge variant="outline">{t(log.status ?? "RECORDED")}</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">{translateUiText("No gateway timeline entries yet.", lang)}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentStat({ label, value }: { label: string; value: string }) {
  const { lang } = useI18n();
  return (
    <div className="rounded-xl border border-border bg-background/35 p-3">
      <div className="text-xs text-muted-foreground">{translateUiText(label, lang)}</div>
      <div className="mt-1 truncate font-semibold">{translateUiText(value, lang)}</div>
    </div>
  );
}

function InvoiceInfo({ className, emptyLabel = "Not provided", label, value }: { className?: string; emptyLabel?: string; label: string; value?: string | null }) {
  return (
    <div className={["rounded-lg bg-background/45 px-3 py-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value || emptyLabel}</p>
    </div>
  );
}

function PriceLine({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background/45 px-3 py-2 text-sm">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function DetailError({ message, title }: { message: string; title: string }) {
  const { lang } = useI18n();
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{translateUiText(title, lang)}</AlertTitle>
      <AlertDescription>{translateUiText(message, lang)}</AlertDescription>
    </Alert>
  );
}

function DetailList({ emptyLabel, items, title }: { emptyLabel: string; items: Array<{ href?: string; meta: string; status: string; title: string }>; title: string }) {
  const { lang } = useI18n();
  return (
    <div className="rounded-xl border border-border bg-background/35 p-3">
      <p className="text-sm font-semibold">{translateUiText(title, lang)}</p>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-background/45 px-3 py-2 text-sm" key={`${item.title}-${item.meta}`}>
            <div className="min-w-0">
              {item.href ? (
                <Link className="truncate font-semibold hover:text-primary" href={item.href as never}>{item.title}</Link>
              ) : (
                <p className="truncate font-semibold">{item.title}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>
            </div>
            <Badge className="shrink-0" variant="outline">{translateUiText(item.status, lang)}</Badge>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground">{translateUiText(emptyLabel, lang)}</p>
        )}
      </div>
    </div>
  );
}

function copyToClipboard(value: string, message: string) {
  void navigator.clipboard?.writeText(value);
  toast.success(message);
}

function orderProgress(status: string, active: "FULFILLMENT" | "PAYMENT" | "REVIEW") {
  const paid = ["PROCESSING", "COMPLETED"].includes(status) || active === "FULFILLMENT";
  const completed = status === "COMPLETED";
  return [
    { done: true, label: "Created", value: "Order recorded" },
    { done: paid || active === "PAYMENT", label: "Payment", value: paid ? "Confirmed" : "Pending" },
    { done: paid, label: "Fulfillment", value: completed ? "Completed" : paid ? "In progress" : "Waiting" },
    { done: completed, label: "Delivery", value: completed ? "Ready" : "Pending" },
  ];
}

function orderNextStep(status: string) {
  if (status === "PENDING") return "Complete payment to move this order into fulfillment.";
  if (status === "PROCESSING") return "Payment is confirmed. The team is preparing delivery, downloads, and licenses.";
  if (status === "COMPLETED") return "Order is complete. Downloads and license records are available from the purchases area.";
  if (status === "REFUNDED") return "Order is closed after refund processing.";
  return "Review order status and contact support if anything looks unexpected.";
}

function RecentTable({ rows }: { rows: Array<{ date: string; href?: string; meta: string; status: string; title: string }> }) {
  const { lang } = useI18n();
  if (!rows.length) {
    return <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border bg-background/30 text-sm text-muted-foreground">{translateUiText("No records yet.", lang)}</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{translateUiText("Record", lang)}</TableHead>
          <TableHead>{translateUiText("Meta", lang)}</TableHead>
          <TableHead>{translateUiText("Status", lang)}</TableHead>
          <TableHead>{translateUiText("Date", lang)}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.title}-${row.date}`}>
            <TableCell className="font-semibold">
              {row.href ? <Link className="hover:text-primary" href={row.href as never}>{row.title}</Link> : row.title}
            </TableCell>
            <TableCell>{row.meta}</TableCell>
            <TableCell><Badge variant="outline">{translateUiText(row.status, lang)}</Badge></TableCell>
            <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <ShadowSkeleton className="h-36 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-32 rounded-2xl" key={index} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ShadowSkeleton className="h-96 rounded-2xl" />
        <ShadowSkeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

function rowsFor(pathname: string, data: ReturnType<typeof normalizeData>) {
  if (pathname.includes("invoice")) return data.invoiceRows;
  if (pathname.includes("payment") || pathname.includes("wallet")) return data.paymentRows;
  if (pathname.includes("download") || pathname.includes("purchase") || pathname.includes("license")) return data.downloadRows;
  if (pathname.includes("support")) return data.ticketRows;
  return data.orderRows;
}

function viewAllHref(pathname: string) {
  if (pathname.includes("invoice")) return "/user/invoices";
  if (pathname.includes("payment") || pathname.includes("wallet")) return "/user/payments";
  if (pathname.includes("download")) return "/user/downloads";
  if (pathname.includes("purchase") || pathname.includes("license")) return "/user/purchases";
  if (pathname.includes("support")) return "/user/support/tickets";
  return "/user/orders";
}

function normalizeData(data: import("@/features/customer-dashboard/api/customer-dashboard-api").CustomerDashboardOverview) {
  return {
    downloadRows: data.recent.downloads.map((item) => ({ date: item.createdAt, meta: item.product.slug, status: "READY", title: item.product.title })),
    invoiceRows: data.recent.invoices.map((item) => ({ date: item.createdAt, href: `/user/invoices/${item.id}`, meta: formatInvoiceMoney(item.total, item.currency), status: item.status, title: item.invoiceNumber })),
    orderRows: data.recent.orders.map((item) => ({ date: item.createdAt, href: `/user/orders/${item.id}`, meta: `${item._count.items} items`, status: item.status, title: item.orderNumber })),
    paymentRows: data.recent.payments.map((item) => ({ date: item.createdAt, href: `/user/payments/${item.id}`, meta: formatInvoiceMoney(item.amount, item.currency), status: item.status, title: item.paymentNumber })),
    ticketRows: data.recent.tickets.map((item) => ({ date: item.updatedAt, meta: item.priority, status: item.status, title: item.ticketNumber })),
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium" });
}

function formatInvoiceCustomerName(customer?: CustomerInvoiceDetail["user"]) {
  const profileName = [customer?.profile?.firstName, customer?.profile?.lastName].filter(Boolean).join(" ");
  return profileName || customer?.email || formatMobileDisplay(customer?.mobile);
}

function formatInvoiceAddress(address?: {
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

function detailIdFromPath(pathname: string, section: "invoices" | "orders" | "payments") {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 3 || segments[0] !== "dashboard" || segments[1] !== section) return null;
  if (reservedDashboardSlugs.has(segments[2])) return null;
  return decodeURIComponent(segments[2]);
}

const reservedDashboardSlugs = new Set(["cancelled", "completed", "custom", "drafts", "failed", "methods", "paid", "payments", "pending", "processing", "recent", "refunded", "refunds"]);

function commerceStatusFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[2];
  if (segments[0] !== "dashboard" || !slug) return "ALL";
  if (segments[1] === "orders") {
    const statuses: Record<string, string> = {
      cancelled: "CANCELLED",
      completed: "COMPLETED",
      pending: "PENDING",
      processing: "PROCESSING",
      refunded: "REFUNDED",
    };
    return statuses[slug] ?? "ALL";
  }
  if (segments[1] === "invoices") {
    const statuses: Record<string, string> = {
      drafts: "DRAFT",
      overdue: "OVERDUE",
      paid: "PAID",
      pending: "PENDING",
    };
    return statuses[slug] ?? "ALL";
  }
  if (segments[1] === "payments") {
    const statuses: Record<string, string> = {
      failed: "FAILED",
      paid: "PAID",
      pending: "PENDING",
      refunded: "REFUNDED",
    };
    return statuses[slug] ?? "ALL";
  }
  return "ALL";
}

function paymentViewFromPath(pathname: string) {
  if (pathname.startsWith("/user/payments/methods")) return "methods";
  if (pathname.startsWith("/user/payments/refunds")) return "refunds";
  if (pathname.startsWith("/user/wallet")) return "wallet";
  return "transactions";
}

function invoiceViewFromPath(pathname: string) {
  if (pathname.startsWith("/user/invoices/payments")) return "payment";
  if (pathname.startsWith("/user/invoices/custom")) return "custom";
  if (pathname.startsWith("/user/invoices/drafts")) return "drafts";
  return "all";
}

function favoriteKindFromPath(pathname: string) {
  if (pathname.endsWith("/favorites/services")) return "services";
  if (pathname.endsWith("/favorites/wishlist")) return "wishlist";
  return "saved";
}

function favoriteTitleFromPath(pathname: string) {
  if (pathname.endsWith("/favorites/services")) return "Saved Services";
  if (pathname.endsWith("/favorites/wishlist")) return "Wishlist";
  if (pathname.startsWith("/user/purchases/saved")) return "Saved Products";
  return undefined;
}

function ticketIdFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 4 || segments[0] !== "dashboard" || segments[1] !== "support" || segments[2] !== "tickets") return null;
  if (segments[3] === "open") return null;
  return decodeURIComponent(segments[3]);
}

function liveChatIdFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 4 || segments[0] !== "dashboard" || segments[1] !== "support" || segments[2] !== "live-chat") return null;
  return decodeURIComponent(segments[3]);
}
