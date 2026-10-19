"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Bell, BadgeCheck, Coins, Copy, CreditCard, EyeOff, FileText, Filter, Gem, Gift, KeyRound, Loader2, Mail, MessageCircle, PackageCheck, Search, ShieldAlert, ShieldCheck, ShoppingBag, ShoppingCart, Smartphone, Ticket, TicketPercent, Trophy, Truck, Wallet } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "@/shared/ui/sonner";
import { ProductImage } from "@/domains/catalog/ProductImage";
import { getProducts } from "@/domains/catalog/products-api";
import { formatPrice, productCategoryLabel } from "@/domains/catalog/products-data";
import { addCartItem, requestPayment, type PaymentRequestResult } from "@/domains/commerce/commerce-api";
import { getProductOrders } from "@/domains/commerce/commerce-api";
import { claimPhysicalReward, getMyWheelRewards, type WheelReward } from "@/domains/wheel/wheel-api";
import { getGiftOverview } from "@/domains/gifts/gifts-api";
import { getCustomerOrderDetail, getCustomerPaymentDetail, type CustomerOrderDetail, type CustomerPaymentDetail } from "@/features/customer-dashboard/api/customer-dashboard-api";

import {
  createDeliveryRequest,
  createBankAccount,
  createSilverOrder,
  createTomanWithdrawal,
  createTomanWalletTopUp,
  cancelTomanWithdrawal,
  deleteBankAccount,
  getBankAccounts,
  getSilverOverview,
  getSilverTransactions,
  getTomanWithdrawals,
  submitKycProfile,
  type SilverOverview,
  type SilverTransactionType,
  type TomanWithdrawalStatus,
} from "@/features/customer-dashboard/api/silver-dashboard-api";
import { CustomerDashboardShell } from "@/features/customer-dashboard/components/CustomerDashboardShell";
import { CustomerAddressManager } from "@/features/customer-dashboard/components/CustomerAddressManager";
import { getSilverPriceHistory } from "@/features/silver-platform/api";
import { createChartCoordinates, createChartPolyline } from "@/features/silver-platform/chart-utils";
import { CustomerLiveChatPanel, CustomerNotificationsPanel, CustomerReferralPanel, CustomerSupportTicketsPanel } from "@/features/customer-dashboard/pages/CustomerActionPanels";
import { CustomerGiftPanel } from "@/features/customer-dashboard/pages/CustomerGiftPanels";
import { findCustomerDashboardItem } from "@/features/customer-dashboard/config/customer-dashboard-navigation";
import { useAuth } from "@/shared/auth/AuthProvider";
import { platformAuth } from "@/shared/auth/platform-auth-client";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { readReferralCheckoutAttribution } from "@/domains/referrals/referral-attribution";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatTomanMoney, parseTomanInput } from "@/shared/lib/toman-money";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

const nf = new Intl.NumberFormat("fa-IR");
type SilverBuyPaymentMethod = "wallet" | "zarinpal";

export function SilverCustomerDashboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useI18n();
  const { loading: authLoading, user } = useAuth();
  const activeItem = findCustomerDashboardItem(pathname);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
  }, [authLoading, pathname, router, user]);

  const overview = useQuery({
    enabled: Boolean(user),
    queryFn: getSilverOverview,
    queryKey: ["silver-dashboard-overview"],
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (authLoading || !user || overview.isLoading) {
    return <CustomerDashboardShell><DashboardSkeleton /></CustomerDashboardShell>;
  }

  if (overview.isError) {
    return (
      <CustomerDashboardShell>
        <Alert variant="destructive">
          <AlertTitle>{translateUiText("Dashboard unavailable", lang)}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </CustomerDashboardShell>
    );
  }

  const data = overview.data;
  if (!data) return <CustomerDashboardShell><DashboardSkeleton /></CustomerDashboardShell>;

  const isKycVerified = data.kyc?.status === "APPROVED";
  const isGiftRoute = pathname.startsWith("/user/gifts");
  const isTradeRoute = pathname.startsWith("/user/buy-silver") || pathname.startsWith("/user/sell-silver");
  const isWalletRoute = pathname.startsWith("/user/wallet") || pathname.startsWith("/user/silver-wallet") || pathname.startsWith("/user/toman-wallet");
  const selectedPaymentId = paymentIdFromPath(pathname);
  const selectedTicketId = ticketIdFromPath(pathname);
  const selectedLiveChatId = liveChatIdFromPath(pathname);

  return (
    <CustomerDashboardShell isKycVerified={isKycVerified}>
      <div className="space-y-5">
        {!isKycVerified ? (
          <Alert className="border-amber-500/45 bg-amber-500/10 text-foreground">
            <ShieldAlert className="size-5 text-amber-600" />
            <AlertTitle>{isGiftRoute ? "برای ارسال و فعال‌سازی هدیه، احراز هویت الزامی است" : "برای خرید و فروش، احراز هویت الزامی است"}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{isGiftRoute ? "هدیه‌های دریافتی محفوظ می‌مانند و پس از تأیید احراز هویت آزاد می‌شوند؛ برای ارسال هدیه نیز احراز هویت فرستنده الزامی است." : "برای ثبت سفارش خرید یا فروش نقره، ابتدا اطلاعات هویتی خود را تکمیل و تأیید کنید."}</span>
              <Button className="shrink-0" onClick={() => router.push("/user/profile")} size="sm">
                احراز هویت
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {!isWalletRoute ? <section className="rounded-2xl border border-border glass p-6 shadow-[0_22px_70px_-48px_var(--glow)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3" variant="outline">{translateUiText(user.status ?? "ACTIVE", lang)}</Badge>
              <h2 className="text-2xl font-black md:text-3xl">{selectedPaymentId ? "جزئیات پرداخت" : pathname === "/user" ? translateUiText("داشبورد نقره", lang) : translateUiText(activeItem.label, lang)}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {selectedPaymentId ? "مبلغ، وضعیت تأیید زرین‌پال و کد مرجع پرداخت را بررسی کنید." : pathname === "/user" ? translateUiText("مدیریت خرید، فروش، کیف پول تومان، دارایی نقره، تحویل فیزیکی و احراز هویت در یک پنل.", lang) : translateUiText(activeItem.description, lang)}
              </p>
            </div>
          </div>
        </section> : null}

        {!isKycVerified && isTradeRoute ? <TradeVerificationRedirect /> : renderRoute(pathname, data, selectedTicketId, selectedLiveChatId)}
      </div>
    </CustomerDashboardShell>
  );
}

function TradeVerificationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/user/profile");
  }, [router]);

  return null;
}

function renderRoute(pathname: string, data: SilverOverview, selectedTicketId?: string, selectedLiveChatId?: string) {
  const paymentId = paymentIdFromPath(pathname);
  if (paymentId) return <PaymentDetailPanel paymentId={paymentId} />;
  if (pathname.startsWith("/user/support/tickets")) return <CustomerSupportTicketsPanel isOpenRoute={pathname.endsWith("/open")} selectedTicketId={selectedTicketId} />;
  if (pathname.startsWith("/user/support/live-chat")) return <CustomerLiveChatPanel selectedConversationId={selectedLiveChatId} />;
  if (pathname.startsWith("/user/notifications")) return <CustomerNotificationsPanel pathname={pathname} />;
  if (pathname.startsWith("/user/referrals")) return <CustomerReferralPanel pathname={pathname} />;
  if (pathname.startsWith("/user/gifts")) return <CustomerGiftPanel pathname={pathname} />;
  if (pathname.startsWith("/user/silver-products")) return <DashboardSilverProducts />;
  if (pathname.startsWith("/user/product-orders")) return <ProductOrdersPanel />;
  if (pathname.startsWith("/user/rewards")) return <WheelRewardsPanel />;
  if (pathname.startsWith("/user/buy-silver")) return <TradePanel data={data} initialSide="BUY" />;
  if (pathname.startsWith("/user/sell-silver")) return <TradePanel data={data} initialSide="SELL" />;
  if (pathname.startsWith("/user/certificates")) return <SilverWalletPanel data={data} />;
  if (pathname.startsWith("/user/bank-accounts")) return <BankAccountsPanel />;
  if (pathname.startsWith("/user/wallet") || pathname.startsWith("/user/silver-wallet") || pathname.startsWith("/user/toman-wallet")) return <AssetsWalletPanel data={data} />;
  if (pathname.startsWith("/user/orders")) return <OrdersPanel data={data} />;
  if (pathname.startsWith("/user/transactions")) return <TransactionsPanel data={data} />;
  if (pathname.startsWith("/user/delivery")) return <DeliveryPanel data={data} />;
  if (pathname.startsWith("/user/account/addresses")) return <CustomerAddressManager />;
  if (pathname === "/user/profile" || pathname.startsWith("/user/account")) return <KycPanel data={data} />;
  return <OverviewPanel data={data} />;
}

function WheelRewardsPanel() {
  const { lang } = useI18n();
  const t = (fa: string, en: string) => lang === "fa" ? fa : en;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [claiming, setClaiming] = useState<WheelReward | null>(null);
  const [claim, setClaim] = useState({ address: "", city: "", postalCode: "", province: "", recipientMobile: "", recipientName: "", userNotes: "" });
  const rewards = useQuery({ queryFn: getMyWheelRewards, queryKey: ["wheel-rewards"], retry: 1 });
  const submitClaim = useMutation({
    mutationFn: () => claimPhysicalReward(claiming!.id, claim),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("ثبت اطلاعات انجام نشد", "Could not submit claim")),
    onSuccess: () => {
      toast.success(t("اطلاعات ارسال ثبت شد", "Shipping details submitted"));
      setClaiming(null);
      void queryClient.invalidateQueries({ queryKey: ["wheel-rewards"] });
    },
  });
  if (rewards.isLoading) return <ShadowSkeleton className="h-96 rounded-2xl" />;
  if (rewards.isError) return <Alert variant="destructive"><AlertTitle>{t("جوایز در دسترس نیست", "Rewards unavailable")}</AlertTitle><AlertDescription>{rewards.error.message}</AlertDescription></Alert>;
  const items = rewards.data?.rewards ?? [];
  return <div className="space-y-5">
    <section className="grid gap-4 md:grid-cols-[320px_1fr]">
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><Wallet className="size-5" /></span><Badge variant="outline">{t("فقط خرید", "Purchase only")}</Badge></div>
          <p className="mt-6 text-sm text-muted-foreground">{t("اعتبار خرید گردونه", "Wheel shopping credit")}</p>
          <strong className="mt-2 block text-3xl font-black">{Number(rewards.data?.shoppingCredit.balance ?? 0).toLocaleString(lang)} <small className="text-sm">{t("تومان", "Toman")}</small></strong>
          <Button asChild className="mt-5 w-full"><a href="/products"><ShoppingBag className="size-4" />{t("استفاده در خرید", "Use in checkout")}</a></Button>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/70">
        <CardHeader><CardTitle>{t("تاریخچه اعتبار", "Credit history")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(rewards.data?.shoppingCredit.transactions ?? []).slice(0, 5).map((transaction) => <div className="flex items-center justify-between rounded-xl border border-border p-3 text-sm" key={transaction.id}><div><p className="font-semibold">{transaction.description}</p><p className="mt-1 text-xs text-muted-foreground">{formatPlatformDate(transaction.createdAt, { dateStyle: "medium" }, lang)}</p></div><span className={Number(transaction.amount) >= 0 ? "font-bold text-emerald-600" : "font-bold text-destructive"}>{Number(transaction.amount) >= 0 ? "+" : ""}{Number(transaction.amount).toLocaleString(lang)}</span></div>)}
          {!rewards.data?.shoppingCredit.transactions.length ? <p className="py-8 text-center text-sm text-muted-foreground">{t("هنوز تراکنشی ثبت نشده", "No credit transactions yet")}</p> : null}
        </CardContent>
      </Card>
    </section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((reward) => <RewardCard key={reward.id} lang={lang} reward={reward} onClaim={() => setClaiming(reward)} />)}
      {!items.length ? <Card className="md:col-span-2 xl:col-span-3"><CardContent className="p-12 text-center"><Gift className="mx-auto size-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-bold">{t("هنوز جایزه‌ای ندارید", "No rewards yet")}</h3><Button asChild className="mt-5"><a href="/wheel">{t("چرخاندن گردونه", "Spin the wheel")}</a></Button></CardContent></Card> : null}
    </section>
    {claiming ? <Card className="border-primary/35 bg-card/80"><CardHeader><CardTitle>{t("اطلاعات ارسال جایزه", "Prize shipping details")}</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      {(["recipientName", "recipientMobile", "province", "city", "postalCode"] as const).map((key) => <Input key={key} onChange={(event) => setClaim((current) => ({ ...current, [key]: event.target.value }))} placeholder={({ recipientName: t("نام گیرنده", "Recipient name"), recipientMobile: t("موبایل گیرنده", "Recipient mobile"), province: t("استان", "Province"), city: t("شهر", "City"), postalCode: t("کد پستی", "Postal code") })[key]} value={claim[key]} />)}
      <Textarea className="md:col-span-2" onChange={(event) => setClaim((current) => ({ ...current, address: event.target.value }))} placeholder={t("نشانی کامل", "Full address")} value={claim.address} />
      <Textarea className="md:col-span-2" onChange={(event) => setClaim((current) => ({ ...current, userNotes: event.target.value }))} placeholder={t("توضیحات اختیاری", "Optional notes")} value={claim.userNotes} />
      <div className="flex gap-2 md:col-span-2"><Button disabled={submitClaim.isPending || !claim.recipientName || !claim.recipientMobile || !claim.province || !claim.city || !claim.postalCode || !claim.address} onClick={() => submitClaim.mutate()}>{submitClaim.isPending ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}{t("ثبت و ارسال برای بررسی", "Submit claim")}</Button><Button onClick={() => setClaiming(null)} variant="outline">{t("انصراف", "Cancel")}</Button></div>
    </CardContent></Card> : null}
  </div>;
}

function RewardCard({ lang, reward, onClaim }: { lang: string; onClaim: () => void; reward: WheelReward }) {
  const isFa = lang === "fa";
  const title = isFa ? reward.prize.titleFa : reward.prize.titleEn;
  const isExpired = reward.status === "EXPIRED";
  const isUsed = reward.status === "REDEEMED";
  const code = reward.promotionCode?.code;
  const Icon = reward.prizeType === "PHYSICAL_PRIZE" ? Trophy : reward.prizeType === "WALLET_CREDIT" ? Coins : reward.prizeType === "EXTRA_SPIN" ? Gift : TicketPercent;
  return <Card className={`overflow-hidden border-border bg-card/70 ${reward.prize.isJackpot ? "ring-1 ring-primary/50" : ""}`}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-6" /></span><Badge variant={isExpired || isUsed ? "secondary" : "outline"}>{rewardStatusLabel(reward.status, isFa)}</Badge></div>
      <h3 className="mt-5 text-lg font-black">{title}</h3>
      <p className="mt-2 text-xs text-muted-foreground">{new Date(reward.createdAt).toLocaleDateString(lang)}</p>
      {code ? <button className="mt-4 flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 font-mono font-bold" onClick={() => { void navigator.clipboard.writeText(code); toast.success(isFa ? "کد کپی شد" : "Code copied"); }}><span>{code}</span><Copy className="size-4" /></button> : null}
      {reward.prizeType === "PHYSICAL_PRIZE" && reward.physicalClaim?.status === "ACTION_REQUIRED" ? <Button className="mt-4 w-full" onClick={onClaim}><PackageCheck className="size-4" />{isFa ? "ثبت آدرس دریافت" : "Add shipping address"}</Button> : null}
      {reward.physicalClaim && reward.physicalClaim.status !== "ACTION_REQUIRED" ? <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs">{isFa ? "وضعیت ارسال" : "Fulfillment"}: <strong>{rewardStatusLabel(reward.physicalClaim.status, isFa)}</strong>{reward.physicalClaim.trackingCode ? <p className="mt-1 font-mono">{reward.physicalClaim.trackingCode}</p> : null}</div> : null}
    </CardContent>
  </Card>;
}

function rewardStatusLabel(status: string, isFa: boolean) {
  if (!isFa) return status.replaceAll("_", " ");
  return ({ AVAILABLE: "قابل استفاده", ACTION_REQUIRED: "نیازمند ثبت آدرس", CLAIM_REQUIRED: "نیازمند دریافت", CLAIM_SUBMITTED: "ثبت شده", SUBMITTED: "ثبت شده", PROCESSING: "در حال پردازش", SHIPPED: "ارسال شده", FULFILLED: "تحویل شده", REDEEMED: "استفاده شده", EXPIRED: "منقضی", REJECTED: "نیازمند اصلاح" } as Record<string, string>)[status] ?? status;
}

function ProductOrdersPanel() {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const searchParams = useSearchParams();
  const selectedOrderId = searchParams.get("order")?.trim() || undefined;
  const orders = useQuery({ queryFn: () => getProductOrders(), queryKey: ["customer-product-orders"], refetchOnMount: "always", retry: 1 });
  const selectedOrder = useQuery({
    enabled: Boolean(selectedOrderId),
    queryFn: () => getCustomerOrderDetail(selectedOrderId!),
    queryKey: ["customer-product-order-detail", selectedOrderId],
    refetchOnMount: "always",
    retry: 1,
  });
  if (orders.isLoading) return <ShadowSkeleton className="h-80 rounded-2xl" />;
  if (orders.isError) return <Alert variant="destructive"><AlertTitle>{t("Orders unavailable")}</AlertTitle><AlertDescription>{orders.error.message}</AlertDescription></Alert>;
  const items = orders.data?.items ?? [];
  return (
    <div className="space-y-5">
      {selectedOrderId && selectedOrder.isLoading ? <ShadowSkeleton className="h-[34rem] rounded-2xl" /> : null}
      {selectedOrderId && selectedOrder.isError ? <Alert variant="destructive"><AlertTitle>جزئیات سفارش در دسترس نیست</AlertTitle><AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>{selectedOrder.error.message}</span><Button onClick={() => void selectedOrder.refetch()} size="sm" variant="outline">تلاش دوباره</Button></AlertDescription></Alert> : null}
      {selectedOrder.data ? <ProductOrderDetailCard lang={lang} order={selectedOrder.data} /> : null}

      <Card className="rounded-2xl border-border bg-card/70">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>{t("Product orders")}</CardTitle><p className="mt-2 text-xs text-muted-foreground">همه سفارش‌های محصولات فیزیکی با مبلغ، پرداخت و وضعیت آماده‌سازی</p></div>
          <Button asChild size="sm" variant="outline"><Link href="/products">{t("Continue shopping")}</Link></Button>
        </CardHeader>
        <CardContent>
          {items.length ? (
            <div className="grid gap-3">
              {items.map((order) => (
                <Link
                  className={`grid gap-4 rounded-2xl border p-4 transition hover:border-primary/40 hover:bg-accent/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${selectedOrderId === order.id ? "border-primary/40 bg-primary/5 ring-1 ring-primary/15" : "border-border bg-background/35"}`}
                  href={`/user/product-orders?order=${encodeURIComponent(order.id)}` as never}
                  key={order.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm">{order.orderNumber}</strong><Badge variant={orderStatusVariant(order.status)}>{t(order.status)}</Badge></div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:flex sm:flex-wrap sm:gap-5">
                      <OrderListValue label={t("Items")} value={`${(order._count?.items ?? 0).toLocaleString(lang)} کالا`} />
                      <OrderListValue label={t("Total")} value={formatOrderMoney(order.total, order.currency, lang)} />
                      <OrderListValue label={t("Date")} value={formatOrderTime(order.createdAt, lang)} />
                    </div>
                  </div>
                  <span className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-bold text-primary">مشاهده جزئیات</span>
                </Link>
              ))}
            </div>
          ) : <div className="py-14 text-center"><PackageCheck className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 text-muted-foreground">{t("No product orders yet.")}</p><Button asChild className="mt-5"><Link href="/products">{t("Browse products")}</Link></Button></div>}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductOrderDetailCard({ lang, order }: { lang: string; order: CustomerOrderDetail }) {
  const t = (text: string) => translateUiText(text, lang);
  const payment = order.payments[0];
  const invoice = order.invoices[0];
  const paymentIsPaid = payment?.status === "PAID" || order.status === "PAID" || order.status === "COMPLETED";
  const silverPaymentGrams = metadataNumber(payment?.metadata, "silverPaymentGrams");
  const deliveryFeeGrams = metadataNumber(order.metadata, "deliveryFeeGrams");
  const deliveryFeeToman = metadataNumber(order.metadata, "deliveryFeeToman");
  const deliveryUnitCount = metadataNumber(order.metadata, "deliveryUnitCount");
  const deliverySource = metadataString(order.metadata, "deliveryFeeSource");
  return (
    <Card className={`overflow-hidden rounded-2xl bg-card/80 shadow-[0_24px_70px_-45px_var(--glow)] ${paymentIsPaid ? "border-emerald-500/35" : "border-border"}`}>
      <CardHeader className={paymentIsPaid ? "border-b border-emerald-500/20 bg-emerald-500/8" : "border-b border-border"}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${paymentIsPaid ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary"}`}><PackageCheck className="size-5" /></span>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-xl">جزئیات سفارش</CardTitle><Badge variant={orderStatusVariant(order.status)}>{t(order.status)}</Badge></div><p className="mt-2 break-all font-mono text-sm text-muted-foreground">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">ثبت‌شده در {formatOrderTime(order.createdAt, lang)}</p></div>
          </div>
          <Button asChild size="sm" variant="outline"><Link href="/user/product-orders">همه سفارش‌ها</Link></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {paymentIsPaid ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-200"><BadgeCheck className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">پرداخت سفارش با موفقیت انجام شد</p><p className="mt-1 text-xs leading-6 opacity-85">جزئیات محصول، مبلغ، روش پرداخت و وضعیت سفارش در ادامه ثبت شده است.</p></div></div> : null}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <OrderFact icon={<ShoppingBag className="size-4" />} label="تعداد اقلام" value={`${order.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString(lang)} عدد`} />
          <OrderFact icon={<Wallet className="size-4" />} label="مبلغ کل" value={formatOrderMoney(order.total, order.currency, lang)} />
          <OrderFact icon={<CreditCard className="size-4" />} label="روش پرداخت" value={paymentGatewayLabel(payment?.gateway)} />
          <OrderFact icon={<BadgeCheck className="size-4" />} label="وضعیت پرداخت" value={payment ? t(payment.status) : "ثبت نشده"} />
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 font-black"><ShoppingBag className="size-5 text-primary" />محصولات سفارش</h3>
          <div className="space-y-3">
            {order.items.map((item) => {
              const weight = metadataNumber(item.metadata, "weightGramsTotal") || metadataNumber(item.metadata, "weightGrams");
              return <div className="rounded-2xl border border-border bg-background/35 p-4" key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><h4 className="font-bold leading-7">{item.title}</h4><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">{item.sku ? <span className="rounded-lg bg-muted px-2 py-1 font-mono">{item.sku}</span> : null}<span className="rounded-lg bg-muted px-2 py-1">تعداد: {item.quantity.toLocaleString(lang)}</span>{weight > 0 ? <span className="rounded-lg bg-muted px-2 py-1">وزن نقره: {weight.toLocaleString(lang)} گرم</span> : null}</div></div>
                  {item.product?.slug ? <Button asChild size="sm" variant="outline"><Link href={`/products/${item.product.slug}` as never}>مشاهده محصول</Link></Button> : null}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs"><OrderListValue label="قیمت واحد" value={formatOrderMoney(item.unitPrice, item.currency, lang)} /><OrderListValue label="جمع محصول" value={formatOrderMoney(item.total, item.currency, lang)} /></div>
              </div>;
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <OrderDetailSection icon={<CreditCard className="size-5 text-primary" />} title="جزئیات پرداخت">
            <OrderDetailRow label="روش پرداخت" value={paymentGatewayLabel(payment?.gateway)} />
            <OrderDetailRow label="شماره پرداخت" value={payment?.paymentNumber || "ثبت نشده"} mono />
            <OrderDetailRow label="مبلغ پرداخت" value={payment ? formatOrderMoney(payment.amount, payment.currency, lang) : "ثبت نشده"} />
            {silverPaymentGrams > 0 ? <OrderDetailRow label="نقره کسرشده" value={`${silverPaymentGrams.toLocaleString(lang, { maximumFractionDigits: 3 })} گرم`} strong /> : null}
            <OrderDetailRow label="وضعیت" value={payment ? t(payment.status) : "ثبت نشده"} />
            <OrderDetailRow label="کد پیگیری" value={payment?.referenceId || payment?.transactionId || "ثبت نشده"} mono />
            <OrderDetailRow label="زمان دقیق پرداخت" value={payment?.paidAt || payment?.verifiedAt || payment?.updatedAt ? formatOrderTime(payment.paidAt || payment.verifiedAt || payment.updatedAt!, lang) : "ثبت نشده"} />
          </OrderDetailSection>

          <OrderDetailSection icon={<FileText className="size-5 text-primary" />} title="فاکتور و مبالغ">
            <OrderDetailRow label="شماره فاکتور" value={invoice?.invoiceNumber || "ثبت نشده"} mono />
            <OrderDetailRow label="جمع محصولات" value={formatOrderMoney(order.subtotal, order.currency, lang)} />
            <OrderDetailRow label="تخفیف" value={formatOrderMoney(order.discount ?? "0", order.currency, lang)} />
            <OrderDetailRow label="مبلغ نهایی" value={formatOrderMoney(order.total, order.currency, lang)} strong />
            <OrderDetailRow label="مانده قابل پرداخت" value={invoice ? formatOrderMoney(invoice.balanceDue, invoice.currency, lang) : "ثبت نشده"} />
            <OrderDetailRow label="وضعیت فاکتور" value={invoice ? t(invoice.status) : "ثبت نشده"} />
            <OrderDetailRow label="آخرین به‌روزرسانی" value={formatOrderTime(order.updatedAt, lang)} />
          </OrderDetailSection>
        </div>

        {(deliveryUnitCount > 0 || deliveryFeeGrams > 0 || deliveryFeeToman > 0) ? <OrderDetailSection icon={<Truck className="size-5 text-primary" />} title="تحویل و هزینه ارسال">
          <OrderDetailRow label="تعداد بسته‌های تحویل" value={`${deliveryUnitCount.toLocaleString(lang)} عدد`} />
          <OrderDetailRow label="منبع پرداخت هزینه تحویل" value={deliverySourceLabel(deliverySource)} />
          {deliveryFeeGrams > 0 ? <OrderDetailRow label="هزینه تحویل معادل نقره" value={`${deliveryFeeGrams.toLocaleString(lang, { maximumFractionDigits: 3 })} گرم`} /> : null}
          {deliveryFeeToman > 0 ? <OrderDetailRow label="هزینه تحویل معادل تومان" value={formatOrderMoney(String(deliveryFeeToman), "TOMAN", lang)} /> : null}
        </OrderDetailSection> : null}
      </CardContent>
    </Card>
  );
}

function OrderFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl border border-border bg-background/35 p-3"><div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="text-primary">{icon}</span>{label}</div><strong className="mt-2 block break-words text-sm leading-6">{value}</strong></div>;
}

function OrderDetailSection({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return <section className="rounded-2xl border border-border bg-background/35 p-4"><h3 className="mb-4 flex items-center gap-2 font-black">{icon}{title}</h3><dl className="space-y-3">{children}</dl></section>;
}

function OrderDetailRow({ label, mono = false, strong = false, value }: { label: string; mono?: boolean; strong?: boolean; value: string }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"><dt className="text-xs leading-6 text-muted-foreground">{label}</dt><dd className={`break-words text-end text-xs leading-6 ${mono ? "font-mono" : ""} ${strong ? "font-black text-primary" : "font-semibold"}`}>{value}</dd></div>;
}

function OrderListValue({ label, value }: { label: string; value: string }) {
  return <span className="min-w-0"><span className="block text-[10px] text-muted-foreground">{label}</span><strong className="mt-1 block break-words text-xs leading-5">{value}</strong></span>;
}

function metadataNumber(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(number) ? number : 0;
}

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function paymentGatewayLabel(gateway?: string) {
  return ({ "silver-wallet": "کیف پول نقره", wallet: "کیف پول تومان", zarinpal: "درگاه زرین‌پال" } as Record<string, string>)[gateway ?? ""] ?? gateway ?? "ثبت نشده";
}

function deliverySourceLabel(source?: string) {
  return ({ SILVER_WALLET: "کیف پول نقره", TOMAN_WALLET: "کیف پول تومان", ORDER_PAYMENT: "همراه مبلغ سفارش", NONE: "بدون هزینه" } as Record<string, string>)[source ?? ""] ?? "ثبت نشده";
}

function orderStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  if (["PAID", "COMPLETED", "FULFILLED", "SHIPPED"].includes(status)) return "default";
  if (["FAILED", "CANCELLED", "REFUNDED", "VOID"].includes(status)) return "destructive";
  if (["PENDING", "PROCESSING", "PREPARING"].includes(status)) return "secondary";
  return "outline";
}

function formatOrderTime(value: string, lang: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "medium" }, lang);
}

function formatOrderMoney(value: string, currency: string, lang: string) {
  const amount = Number(value || 0);
  if (["IRR", "RIAL", "IRT", "TOMAN"].includes(currency.trim().toUpperCase())) {
    return formatTomanMoney(amount, currency, lang === "fa" ? "fa-IR" : lang);
  }
  return new Intl.NumberFormat(lang, { currency, style: "currency" }).format(amount);
}

function DashboardSilverProducts() {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [busy, setBusy] = useState<string>();
  const products = useQuery({ queryFn: () => getProducts(lang), queryKey: ["dashboard-silver-products", lang] });
  const items = products.data ?? [];
  const add = async (id: string | undefined, slug: string) => {
    if (!id) {
      toast.error(t("This product is not available in the live catalog."));
      return;
    }
    setBusy(slug);
    try {
      await addCartItem({ productId: id, productSlug: slug, quantity: 1 });
      toast.success(t("Product added to cart."));
      void queryClient.invalidateQueries({ queryKey: ["commerce-cart"] });
      router.push("/cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not add the product to your cart."));
    } finally {
      setBusy(undefined);
    }
  };
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.isLoading ? Array.from({ length: 3 }).map((_, index) => <ShadowSkeleton className="h-96 rounded-2xl" key={index} />) : null}
      {products.isError ? <Alert className="md:col-span-2 xl:col-span-3" variant="destructive"><AlertTitle>{t("Products unavailable")}</AlertTitle><AlertDescription>{products.error.message}</AlertDescription></Alert> : null}
      {items.map((product) => (
        <Card className="overflow-hidden rounded-2xl border-border bg-card/70" key={product.slug}>
          <div className="h-40 overflow-hidden bg-muted">
            <ProductImage alt={product.title[lang]} src={product.cover} />
          </div>
          <CardHeader><CardTitle>{product.title[lang]}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{product.short[lang]}</p>
            <div className="flex items-center justify-between"><strong>{formatPrice(product)}</strong><Badge variant="outline">{productCategoryLabel(product, "fa")}</Badge></div>
            <Button className="w-full" disabled={busy === product.slug || !product.id} onClick={() => void add(product.id, product.slug)}>
              {busy === product.slug ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />} {t("Add product to cart")}
            </Button>
          </CardContent>
        </Card>
      ))}
      {!products.isLoading && !items.length ? <Card className="md:col-span-2 xl:col-span-3"><CardContent className="p-10 text-center text-muted-foreground">{t("No silver products have been published yet.")}</CardContent></Card> : null}
    </div>
  );
}

function OverviewPanel({ data }: { data: SilverOverview }) {
  const { dir } = useI18n();
  const toman = data.wallets.find((wallet) => wallet.currency === "TOMAN");
  const silver = data.wallets.find((wallet) => wallet.currency === "SILVER_GRAM");
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Coins} label="قیمت خرید هر گرم" meta="قیمت لحظه‌ای با اسپرد خرید" value={formatToman(data.price.buyPricePerGram)} />
        <StatCard icon={Coins} label="قیمت فروش هر گرم" meta="تسویه به کیف پول تومان" value={formatToman(data.price.sellPricePerGram)} />
        <StatCard icon={Wallet} label="کیف پول تومان" meta="موجودی قابل استفاده" value={formatToman(toman?.balance ?? 0)} />
        <StatCard icon={BadgeCheck} label="دارایی نقره" meta="قابل معامله و قابل تحویل" value={formatGram(silver?.balance ?? data.holding.availableGrams)} />
        <StatCard icon={TicketPercent} label="اعتبار پاداش معرفی" meta="فقط برای کارمزد؛ غیرقابل برداشت" value={formatToman(data.referralFeeCredit.balance)} />
      </section>
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" dir="ltr">
        <div className="min-w-0" dir={dir}><SilverHistoryChart /></div>
        <div className="min-w-0" dir={dir}><DashboardTradeConverter data={data} /></div>
      </section>
      <OrdersPanel data={data} compact />
    </>
  );
}

function SilverHistoryChart() {
  const history = useQuery({
    queryFn: () => getSilverPriceHistory(30),
    queryKey: ["silver-price-history", 30],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const rows = history.data ?? [];
  const allValues = rows.flatMap((row) => [
    Number(row.pricePerGram),
    Number(row.buyPricePerGram),
    Number(row.sellPricePerGram),
  ]).filter(Number.isFinite);
  const min = allValues.length ? Math.min(...allValues) : undefined;
  const max = allValues.length ? Math.max(...allValues) : undefined;
  const points = (key: "pricePerGram" | "buyPricePerGram" | "sellPricePerGram") => createChartPolyline(
    rows.map((row) => Number(row[key])),
    { max, min },
  );

  return (
    <Card className="h-full rounded-2xl border-border bg-card/70">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>نمودار قیمت نقره از داده‌های ثبت‌شده</CardTitle>
        <Badge variant="outline">۳۰ روز</Badge>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <>
            <div className="h-64 rounded-xl border border-border bg-background/35 p-4">
              <svg aria-label="نمودار قیمت بازار، خرید و فروش نقره" className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline fill="none" points={points("buyPricePerGram")} stroke="var(--primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                <polyline fill="none" points={points("pricePerGram")} stroke="var(--foreground)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
                <polyline fill="none" points={points("sellPricePerGram")} stroke="var(--chart-2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>● خرید</span><span>● بازار</span><span>● فروش</span>
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">پس از ثبت اولین بروزرسانی، نمودار نمایش داده می‌شود.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardTradeConverter({ data, initialGrams = "", initialSide = "BUY" }: {
  data: SilverOverview;
  initialGrams?: string;
  initialSide?: "BUY" | "SELL";
}) {
  const { dir } = useI18n();
  const normalizedInitialGrams = normalizeTradeDecimalInput(initialGrams);
  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<SilverBuyPaymentMethod>("zarinpal");
  const [source, setSource] = useState<"GRAMS" | "TOMAN">(normalizedInitialGrams ? "GRAMS" : "TOMAN");
  const [rawInput, setRawInput] = useState(normalizedInitialGrams);
  const orderKey = useRef(crypto.randomUUID());
  const paymentKey = useRef(crypto.randomUUID());
  const queryClient = useQueryClient();
  const price = side === "BUY" ? Number(data.price.buyPricePerGram) : Number(data.price.sellPricePerGram);
  const feePercent = side === "BUY" ? Number(data.price.buyFeePercent) : Number(data.price.sellFeePercent);
  const settlementPricePerGram = Math.max(0, price * (side === "BUY" ? 1 + feePercent / 100 : 1 - feePercent / 100));
  const inputAmount = toFiniteNumber(rawInput);
  const grams = source === "GRAMS" ? inputAmount : settlementPricePerGram > 0 ? inputAmount / settlementPricePerGram : 0;
  const toman = source === "TOMAN" ? inputAmount : grams * settlementPricePerGram;
  const gross = grams * price;
  const feeAmount = gross * feePercent / 100;
  const tomanValue = source === "TOMAN" ? rawInput : inputAmount > 0 ? formatTradeInput(toman, 0) : "";
  const gramsValue = source === "GRAMS" ? rawInput : inputAmount > 0 ? formatTradeInput(grams, 6) : "";
  const tomanWallet = data.wallets.find((wallet) => wallet.currency === "TOMAN");
  const silverWallet = data.wallets.find((wallet) => wallet.currency === "SILVER_GRAM");
  const tomanBalance = Number(tomanWallet?.balance ?? 0);
  const silverBalance = Number(silverWallet?.balance ?? data.holding.availableGrams);
  const isKycVerified = data.kyc?.status === "APPROVED";
  const meetsMinimum = side === "BUY" ? toman >= Number(data.price.minBuyToman) : grams >= Number(data.price.minSellGram);
  const hasEnoughBalance = side === "BUY" ? paymentMethod === "zarinpal" || toman <= tomanBalance : grams <= silverBalance;
  const canSubmit = isKycVerified && grams > 0 && toman > 0 && settlementPricePerGram > 0 && meetsMinimum && hasEnoughBalance;
  const order = useMutation({
    mutationFn: () => submitSilverOrderPayment({
      gateway: paymentMethod,
      input: { ...readReferralCheckoutAttribution(), grams, type: side },
      orderKey: orderKey.current,
      paymentKey: paymentKey.current,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ثبت سفارش ناموفق بود."),
    onSuccess: ({ payment }) => {
      if (payment?.paymentUrl) {
        window.location.assign(payment.paymentUrl);
        return;
      }
      toast.success(side === "BUY" ? "سفارش خرید پرداخت و ثبت شد." : "سفارش فروش ثبت شد.");
      setRawInput("");
      orderKey.current = crypto.randomUUID();
      paymentKey.current = crypto.randomUUID();
      void queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] });
    },
  });
  const helperText = !isKycVerified
    ? "برای معامله ابتدا احراز هویت را تکمیل کنید."
    : inputAmount <= 0
      ? "مبلغ تومان یا وزن نقره را وارد کنید؛ مقدار دیگر خودکار محاسبه می‌شود."
      : !meetsMinimum
        ? `حداقل ${side === "BUY" ? formatToman(data.price.minBuyToman) : formatGram(data.price.minSellGram)} است.`
        : !hasEnoughBalance
          ? side === "BUY" ? "موجودی کیف پول تومان کافی نیست؛ درگاه زرین‌پال را انتخاب کنید." : "موجودی نقره کافی نیست."
          : "قیمت و کارمزد نهایی هنگام ثبت سفارش دوباره بررسی می‌شود.";

  const selectSide = (nextSide: "BUY" | "SELL") => {
    if (nextSide === side) return;
    setConfirmationOpen(false);
    setSide(nextSide);
    setRawInput("");
    orderKey.current = crypto.randomUUID();
    paymentKey.current = crypto.randomUUID();
  };

  const selectPaymentMethod = (value: SilverBuyPaymentMethod) => {
    setPaymentMethod(value);
    orderKey.current = crypto.randomUUID();
    paymentKey.current = crypto.randomUUID();
  };

  return (
    <Card className="h-full min-w-0 rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="size-5 text-primary" />خرید و فروش نقره</CardTitle>
      </CardHeader>
      <CardContent>
        <div aria-label="نوع معامله" className="grid grid-cols-2 rounded-xl bg-muted p-1" role="group">
          {(["BUY", "SELL"] as const).map((value) => (
            <button
              aria-pressed={side === value}
              className={`rounded-lg py-2.5 text-sm font-bold transition ${side === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              key={value}
              onClick={() => selectSide(value)}
              type="button"
            >
              {value === "BUY" ? "خرید" : "فروش"}
            </button>
          ))}
        </div>

        <label className="mt-5 block" htmlFor="dashboard-trade-toman">
          <span className="text-sm font-semibold">{side === "BUY" ? "مبلغ پرداختی" : "مبلغ دریافتی"}</span>
          <span className="mt-2 flex items-center rounded-xl border border-border bg-background/45 px-4 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
            <input
              className="min-w-0 flex-1 bg-transparent py-3.5 text-left font-bold tabular-nums outline-none"
              dir="ltr"
              id="dashboard-trade-toman"
              inputMode="numeric"
              onChange={(event) => { setSource("TOMAN"); setRawInput(normalizeTradeIntegerInput(event.target.value)); orderKey.current = crypto.randomUUID(); paymentKey.current = crypto.randomUUID(); }}
              placeholder="۰"
              value={tomanValue}
            />
            <span className="text-sm text-muted-foreground">تومان</span>
          </span>
        </label>

        <label className="mt-4 block" htmlFor="dashboard-trade-grams">
          <span className="text-sm font-semibold">وزن نقره</span>
          <span className="mt-2 flex items-center rounded-xl border border-border bg-background/45 px-4 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
            <input
              className="min-w-0 flex-1 bg-transparent py-3.5 text-left font-bold tabular-nums outline-none"
              dir="ltr"
              id="dashboard-trade-grams"
              inputMode="decimal"
              onChange={(event) => { setSource("GRAMS"); setRawInput(normalizeTradeDecimalInput(event.target.value)); orderKey.current = crypto.randomUUID(); paymentKey.current = crypto.randomUUID(); }}
              placeholder="۰.۰۰۰"
              value={gramsValue}
            />
            <span className="text-sm text-muted-foreground">گرم</span>
          </span>
        </label>

        <div className="mt-5 space-y-2 rounded-xl border border-border bg-background/35 p-4 text-xs">
          <Row label={`نرخ ${side === "BUY" ? "خرید" : "فروش"} هر گرم`} value={formatToman(price)} />
          <Row label="کارمزد تقریبی" value={`${toFa(feePercent)}٪ · ${formatToman(feeAmount)}`} />
          <Row label={side === "BUY" ? "موجودی تومان" : "موجودی نقره"} value={side === "BUY" ? formatToman(tomanBalance) : formatGram(silverBalance)} />
        </div>

        {side === "BUY" ? <SilverBuyPaymentPicker className="mt-4" paymentMethod={paymentMethod} setPaymentMethod={selectPaymentMethod} /> : null}

        <Button
          className={`mt-5 h-11 w-full ${side === "SELL" ? "bg-destructive text-white hover:bg-destructive/90" : ""}`}
          disabled={!canSubmit || order.isPending}
          onClick={() => setConfirmationOpen(true)}
        >
          {order.isPending ? <Loader2 className="size-4 animate-spin" /> : <Coins className="size-4" />}
          {side === "BUY" ? "بررسی و تأیید خرید" : "بررسی و تأیید فروش"}
        </Button>
        <p className={`mt-3 text-center text-xs leading-5 ${inputAmount > 0 && (!meetsMinimum || !hasEnoughBalance || !isKycVerified) ? "text-destructive" : "text-muted-foreground"}`}>{helperText}</p>
      </CardContent>
      <AlertDialog onOpenChange={setConfirmationOpen} open={confirmationOpen}>
        <AlertDialogContent className="max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl sm:max-w-lg" dir={dir}>
          <AlertDialogHeader>
            <div className={`mx-auto mb-1 grid size-12 place-items-center rounded-full sm:mx-0 ${side === "BUY" ? "bg-primary/15 text-primary" : "bg-destructive/10 text-destructive"}`}><ArrowLeftRight className="size-6" /></div>
            <AlertDialogTitle className="text-xl font-black">تأیید نهایی {side === "BUY" ? "خرید" : "فروش"} نقره</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              لطفاً جزئیات زیر را با دقت بررسی کنید. سفارش فقط پس از انتخاب دکمه تأیید نهایی ثبت می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <ConfirmationRow label="نوع عملیات" value={side === "BUY" ? "خرید نقره" : "فروش نقره"} />
            <ConfirmationRow label="وزن نقره" value={formatGram(grams)} />
            <ConfirmationRow label={side === "BUY" ? "مبلغ نهایی پرداخت" : "مبلغ تقریبی دریافتی"} value={formatToman(toman)} />
            <ConfirmationRow label={`نرخ ${side === "BUY" ? "خرید" : "فروش"} هر گرم`} value={formatToman(price)} />
            <ConfirmationRow label="کارمزد تقریبی" value={`${toFa(feePercent)}٪ · ${formatToman(feeAmount)}`} />
            {side === "BUY" ? <ConfirmationRow label="روش پرداخت" value={paymentMethod === "wallet" ? "کیف پول تومان" : "درگاه زرین‌پال"} /> : null}
          </div>
          <div className={`rounded-xl border p-4 text-sm font-semibold leading-7 ${side === "BUY" ? "border-primary/30 bg-primary/10" : "border-destructive/30 bg-destructive/10"}`}>
            {side === "BUY"
              ? `با تأیید این سفارش، ${formatGram(grams)} نقره خریداری و مبلغ ${formatToman(toman)} از روش پرداخت انتخاب‌شده پرداخت می‌شود.`
              : `با تأیید این سفارش، ${formatGram(grams)} از دارایی نقره شما فروخته و مبلغ تقریبی ${formatToman(toman)} به کیف پول تومان واریز می‌شود.`}
          </div>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel>بازگشت و بررسی</AlertDialogCancel>
            <AlertDialogAction
              className={side === "SELL" ? "bg-destructive text-white hover:bg-destructive/90" : ""}
              onClick={() => order.mutate()}
            >
              تأیید و ثبت {side === "BUY" ? "خرید" : "فروش"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ConfirmationRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted-foreground">{label}</span><strong className="text-end tabular-nums">{value}</strong></div>;
}

function TradePanel({ data, initialSide }: { data: SilverOverview; initialSide: "BUY" | "SELL" }) {
  const { dir } = useI18n();
  const searchParams = useSearchParams();
  const requestedSide = searchParams.get("side")?.toUpperCase();
  const side = requestedSide === "BUY" || requestedSide === "SELL" ? requestedSide : initialSide;
  const initialGrams = searchParams.get("grams") ?? "";
  const tomanWallet = data.wallets.find((wallet) => wallet.currency === "TOMAN");
  const silverWallet = data.wallets.find((wallet) => wallet.currency === "SILVER_GRAM");
  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Coins} label="قیمت لحظه‌ای نقره" meta="قیمت پایه هر گرم نقره ۹۹۹" value={formatToman(data.price.pricePerGram)} />
        <StatCard icon={Wallet} label="موجودی تومان" meta="موجودی قابل استفاده برای خرید" value={formatToman(tomanWallet?.balance ?? 0)} />
        <StatCard icon={BadgeCheck} label="موجودی نقره" meta="دارایی قابل فروش و تحویل" value={formatGram(silverWallet?.balance ?? data.holding.availableGrams)} />
      </section>
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]" dir="ltr">
        <div className="order-2 min-w-0 xl:order-1" dir={dir}><SilverHistoryChart /></div>
        <div className="order-1 min-w-0 xl:order-2" dir={dir}>
          <DashboardTradeConverter data={data} initialGrams={initialGrams} initialSide={side} key={`${side}:${initialGrams}`} />
        </div>
      </section>
      <OrdersPanel data={data} compact />
    </div>
  );
}

function SilverBuyPaymentPicker({ className = "", paymentMethod, setPaymentMethod }: {
  className?: string;
  paymentMethod: SilverBuyPaymentMethod;
  setPaymentMethod: (value: SilverBuyPaymentMethod) => void;
}) {
  const options = [
    { description: "پرداخت امن از درگاه شتاب زرین‌پال", icon: CreditCard, label: "درگاه زرین‌پال", value: "zarinpal" as const },
    { description: "برداشت فوری از موجودی کیف پول تومان", icon: Wallet, label: "کیف پول تومان", value: "wallet" as const },
  ];
  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      {options.map((option) => {
        const Icon = option.icon;
        const active = paymentMethod === option.value;
        return (
          <button
            aria-pressed={active}
            className={`rounded-xl border p-3 text-start transition ${active ? "border-primary bg-primary/10" : "border-border bg-background/35 hover:border-primary/40"}`}
            key={option.value}
            onClick={() => setPaymentMethod(option.value)}
            type="button"
          >
            <span className="flex items-center gap-2 text-sm font-bold"><Icon className="size-4 text-primary" />{option.label}</span>
            <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}

async function submitSilverOrderPayment({ gateway, input, orderKey, paymentKey }: {
  gateway: SilverBuyPaymentMethod;
  input: { grams: number; referralClickId?: string; referralCode?: string; type: "BUY" | "SELL" };
  orderKey: string;
  paymentKey: string;
}): Promise<{ order: Awaited<ReturnType<typeof createSilverOrder>>; payment?: PaymentRequestResult }> {
  const order = await createSilverOrder({
    ...input,
    paymentMethod: input.type === "BUY" ? gateway === "wallet" ? "WALLET" : "GATEWAY" : undefined,
  }, orderKey);
  if (input.type === "SELL") return { order };
  if (!order.invoiceId) throw new Error("فاکتور پرداخت سفارش نقره ایجاد نشد.");
  const payment = await requestPayment({ gateway, invoiceId: order.invoiceId }, { idempotencyKey: paymentKey });
  return { order, payment };
}

function SilverWalletPanel({ data, compact = false }: { compact?: boolean; data: SilverOverview }) {
  return (
    <Card className="rounded-2xl border-border bg-card/70">
      <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="size-5 text-primary" />دارایی نقره</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Row label="موجودی آزاد" value={formatGram(data.holding.availableGrams)} />
        <Row label="موجودی قفل‌شده" value={formatGram(data.holding.lockedGrams)} />
        <Row label="وضعیت گواهی" value={data.holding.authenticityStatus === "CERTIFIED" ? "دارای گواهی اصالت" : "در انتظار بررسی"} />
        <Row label="شماره گواهی" value={data.holding.certificateNumber ?? "پس از تحویل صادر می‌شود"} />
        <Row label="بسته پلمب" value={data.holding.sealedPackageEligible ? "مجاز" : "نیازمند حداقل تحویل"} />
        {!compact ? <OrdersPanel data={data} compact /> : null}
      </CardContent>
    </Card>
  );
}

function AssetsWalletPanel({ data }: { data: SilverOverview }) {
  const tomanWallet = data.wallets.find((item) => item.currency === "TOMAN");
  const silverWallet = data.wallets.find((item) => item.currency === "SILVER_GRAM");
  const tomanBalance = Number(tomanWallet?.balance ?? 0);
  const referralFeeCreditBalance = Number(data.referralFeeCredit.balance ?? 0);
  const availableSilver = Number(silverWallet?.balance ?? data.holding.availableGrams);
  const lockedSilver = Number(silverWallet?.locked ?? data.holding.lockedGrams);
  const silverTomanValue = availableSilver * Number(data.price.sellPricePerGram);
  const totalAsset = tomanBalance + silverTomanValue;
  const assetChange = silverTomanValue * Number(data.price.change24h ?? 0) / 100;
  const withdrawnSilver = data.deliveryRequests
    .filter((request) => ["FULFILLED", "SHIPPED", "DELIVERED"].includes(request.status))
    .reduce((total, request) => total + Number(request.grams ?? 0), 0);
  const minimumTopUpToman = Number(data.price.minWalletTopUpToman ?? 50_000);
  const maximumTopUpToman = Number(data.price.maxWalletTopUpToman ?? 100_000_000);
  const [topUpAmount, setTopUpAmount] = useState(String(minimumTopUpToman));
  const topUpAmountToman = parseTomanInput(topUpAmount);
  const topUpAmountIsValid = topUpAmountToman >= minimumTopUpToman && topUpAmountToman <= maximumTopUpToman;
  const [walletAction, setWalletAction] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [transactionType, setTransactionType] = useState<"ALL" | SilverTransactionType>("ALL");
  const [transactionStatus, setTransactionStatus] = useState("ALL");
  const [transactionSearch, setTransactionSearch] = useState("");
  const deferredTransactionSearch = useDeferredValue(transactionSearch);
  const [transactionPage, setTransactionPage] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState("100000");
  const [withdrawBankAccountId, setWithdrawBankAccountId] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const queryClient = useQueryClient();
  const bankAccounts = useQuery({ queryFn: getBankAccounts, queryKey: ["silver-bank-accounts"], retry: 1 });
  const withdrawals = useQuery({ queryFn: getTomanWithdrawals, queryKey: ["toman-withdrawals"], refetchInterval: 15_000, retry: 1 });
  const transactions = useQuery({
    queryFn: () => getSilverTransactions({
      page: transactionPage,
      pageSize: 10,
      search: deferredTransactionSearch.trim() || undefined,
      status: transactionStatus === "ALL" ? undefined : transactionStatus,
      type: transactionType === "ALL" ? undefined : transactionType,
    }),
    queryKey: ["wallet-transactions", transactionPage, deferredTransactionSearch, transactionStatus, transactionType],
    placeholderData: (previous) => previous,
    retry: 1,
  });
  const topUp = useMutation({
    mutationFn: () => createTomanWalletTopUp({ amount: topUpAmountToman }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "شروع شارژ کیف پول ناموفق بود."),
    onSuccess: (payment) => {
      if (payment.paymentUrl) {
        window.location.assign(payment.paymentUrl);
        return;
      }
      toast.success("درخواست شارژ زرین‌پال ثبت شد و پس از تأیید پرداخت به کیف پول افزوده می‌شود.");
      void queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] });
    },
  });
  const createWithdrawal = useMutation({
    mutationFn: () => createTomanWithdrawal({
      amount: Number(withdrawAmount),
      bankAccountId: withdrawBankAccountId || bankAccounts.data?.find((account) => account.isVerified)?.id || "",
      userNote: withdrawNote.trim() || undefined,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ثبت درخواست برداشت ناموفق بود."),
    onSuccess: () => {
      setWithdrawNote("");
      toast.success("درخواست برداشت ثبت شد و مبلغ تا پایان بررسی محفوظ ماند.");
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["toman-withdrawals"] }),
      ]);
    },
  });
  const cancelWithdrawal = useMutation({
    mutationFn: cancelTomanWithdrawal,
    onError: (error) => toast.error(error instanceof Error ? error.message : "لغو درخواست برداشت ناموفق بود."),
    onSuccess: () => {
      toast.success("درخواست لغو شد و مبلغ به موجودی قابل برداشت بازگشت.");
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["toman-withdrawals"] }),
      ]);
    },
  });

  const verifiedBankAccounts = bankAccounts.data?.filter((account) => account.isVerified) ?? [];
  const selectedBankAccountId = withdrawBankAccountId || verifiedBankAccounts[0]?.id || "";

  return (
    <div className="space-y-5">
    <section className="grid items-start gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        <Card className="overflow-hidden rounded-2xl border-border bg-card/85 shadow-elegant">
          <CardHeader className="pb-4"><CardTitle className="text-2xl">کیف پول شما</CardTitle></CardHeader>
          <CardContent className="pb-6">
            <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#d9e5ed_0%,#a9cce9_48%,#75afe0_100%)] px-5 pb-16 pt-5 text-slate-900">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,.45),transparent_42%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-600">ارزش کل دارایی</p>
                  <strong className="mt-2 block text-2xl font-black">{formatToman(totalAsset)}</strong>
                  <p className="mt-4 text-[11px] text-slate-600">ارزش دارایی مجموع دارایی نقره و موجودی نقدی شماست</p>
                </div>
                <EyeOff className="mt-1 size-5 text-slate-600" />
              </div>
            </div>

            <div className="relative z-10 mx-3 -mt-11 grid overflow-hidden rounded-xl border border-white/80 bg-white text-slate-900 shadow-lg dark:border-border dark:bg-card dark:text-foreground sm:grid-cols-3">
              <div className="flex items-center justify-center gap-3 border-b border-slate-100 p-4 sm:border-b-0 sm:border-e dark:border-border">
                <span className="grid size-9 place-items-center rounded-full bg-sky-50 text-sky-700 dark:bg-primary/10 dark:text-primary"><Gem className="size-5" /></span>
                <div><p className="text-xs text-slate-500 dark:text-muted-foreground">موجودی نقره</p><strong className="mt-1 block">{formatGram(availableSilver)}</strong></div>
              </div>
              <div className="flex items-center justify-center gap-3 border-b border-slate-100 p-4 sm:border-b-0 sm:border-e dark:border-border">
                <span className="grid size-9 place-items-center rounded-full bg-sky-50 text-sky-700 dark:bg-primary/10 dark:text-primary"><Coins className="size-5" /></span>
                <div><p className="text-xs text-slate-500 dark:text-muted-foreground">موجودی تومان</p><strong className="mt-1 block">{formatToman(tomanBalance)}</strong></div>
              </div>
              <div className="flex items-center justify-center gap-3 p-4">
                <span className="grid size-9 place-items-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"><TicketPercent className="size-5" /></span>
                <div><p className="text-xs text-slate-500 dark:text-muted-foreground">اعتبار پاداش معرفی</p><strong className="mt-1 block">{formatToman(referralFeeCreditBalance)}</strong><p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">فقط برای کارمزد</p></div>
              </div>
            </div>

            <p className="mt-3 text-center text-[11px] leading-6 text-muted-foreground">اعتبار پاداش معرفی فقط به‌صورت خودکار از کارمزدهای واجد شرایط کسر می‌شود، قابل برداشت نیست و در ارزش کل دارایی محاسبه نمی‌شود.</p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button className="flex h-14 items-center rounded-xl bg-muted px-3 text-sm font-bold transition hover:bg-muted/75" onClick={() => setWalletAction(walletAction === "DEPOSIT" ? null : "DEPOSIT")} type="button"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-card shadow-sm"><ArrowDownToLine className="size-5 text-primary" /></span><span className="flex-1 text-center">واریز</span></button>
              <button className="flex h-14 items-center rounded-xl bg-muted px-3 text-sm font-bold transition hover:bg-muted/75" onClick={() => setWalletAction(walletAction === "WITHDRAW" ? null : "WITHDRAW")} type="button"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-card shadow-sm"><ArrowUpFromLine className="size-5 text-primary" /></span><span className="flex-1 text-center">برداشت</span></button>
            </div>

            {walletAction === "DEPOSIT" ? (
              <div className="mt-4 space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
                <p className="font-bold">افزایش موجودی تومان</p>
                <p className="text-xs leading-6 text-muted-foreground">حداقل مبلغ واریز {formatToman(minimumTopUpToman)} و حداکثر آن {formatToman(maximumTopUpToman)} است. مبلغ دقیقاً با واحد تومان به زرین‌پال ارسال می‌شود.</p>
                <div className="flex flex-col gap-2 sm:flex-row"><Input aria-invalid={!topUpAmountIsValid} aria-label="مبلغ شارژ به تومان" inputMode="numeric" onChange={(event) => setTopUpAmount(event.target.value)} placeholder="مبلغ به تومان" type="text" value={topUpAmount} /><Button disabled={topUp.isPending || !topUpAmountIsValid} onClick={() => topUp.mutate()}>{topUp.isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}پرداخت با زرین‌پال</Button></div>
                <p className="text-[11px] text-muted-foreground">مبلغ پرداخت: {formatToman(topUpAmountToman)}</p>
                {topUpAmountToman > maximumTopUpToman ? <p className="text-xs text-destructive">حداکثر مبلغ پرداخت آنلاین {formatToman(maximumTopUpToman)} است.</p> : null}
              </div>
            ) : null}

            {walletAction === "WITHDRAW" ? (
              <div className="mt-4 space-y-4 rounded-xl border border-border bg-background/45 p-4" id="bank-accounts">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-bold">برداشت تومان</p><p className="mt-1 text-xs leading-6 text-muted-foreground">وجه فقط به حساب بانکی تأییدشده و متعلق به شما انتقال داده می‌شود.</p></div>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700" variant="outline"><ShieldCheck className="size-3.5" />احراز مالکیت شبا</Badge>
                </div>

                {bankAccounts.isLoading ? <ShadowSkeleton className="h-20 rounded-xl" /> : null}
                {!bankAccounts.isLoading && !verifiedBankAccounts.length ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center">
                    <p className="text-sm font-medium">برای برداشت، ابتدا یک شماره شبای تأییدشده اضافه کنید.</p>
                    <Button asChild className="mt-3" size="sm" variant="outline"><Link href="/user/bank-accounts"><CreditCard className="size-4" />افزودن حساب بانکی</Link></Button>
                  </div>
                ) : null}

                {verifiedBankAccounts.length ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground" htmlFor="withdraw-bank-account">حساب مقصد</label>
                      <Select dir="rtl" onValueChange={setWithdrawBankAccountId} value={selectedBankAccountId}>
                        <SelectTrigger id="withdraw-bank-account"><SelectValue placeholder="حساب بانکی را انتخاب کنید" /></SelectTrigger>
                        <SelectContent>{verifiedBankAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.bankName ?? "حساب بانکی"} · {account.iban.slice(-8)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3"><label className="text-xs font-medium text-muted-foreground" htmlFor="withdraw-amount">مبلغ برداشت (تومان)</label><button className="text-xs font-bold text-primary" onClick={() => setWithdrawAmount(String(Math.floor(tomanBalance)))} type="button">کل موجودی</button></div>
                      <Input id="withdraw-amount" inputMode="numeric" min={100000} onChange={(event) => setWithdrawAmount(event.target.value)} step={10000} type="number" value={withdrawAmount} />
                      <div className="flex justify-between text-[11px] text-muted-foreground"><span>حداقل برداشت: {formatToman(100000)}</span><span>قابل برداشت: {formatToman(tomanBalance)}</span></div>
                    </div>
                    <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground" htmlFor="withdraw-note">توضیحات (اختیاری)</label><Textarea id="withdraw-note" maxLength={500} onChange={(event) => setWithdrawNote(event.target.value)} placeholder="در صورت نیاز توضیح کوتاهی بنویسید" value={withdrawNote} /></div>
                    <Button className="w-full" disabled={createWithdrawal.isPending || Number(withdrawAmount) < 100000 || Number(withdrawAmount) > tomanBalance || !selectedBankAccountId} onClick={() => createWithdrawal.mutate()}>
                      {createWithdrawal.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpFromLine className="size-4" />}ثبت درخواست برداشت
                    </Button>
                    <p className="text-[11px] leading-6 text-muted-foreground">پس از ثبت، مبلغ تا بررسی واحد مالی از موجودی قابل برداشت جدا می‌شود. در صورت رد یا ناموفق بودن انتقال، مبلغ خودکار بازگردانده خواهد شد.</p>
                  </>
                ) : null}

                {withdrawals.data?.items.length ? (
                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-sm font-bold">درخواست‌های اخیر</p>
                    {withdrawals.data.items.slice(0, 5).map((withdrawal) => (
                      <div className="rounded-xl border border-border bg-card/70 p-3" key={withdrawal.id}>
                        <div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{formatToman(withdrawal.amount)}</strong><p className="mt-1 text-[11px] text-muted-foreground">{withdrawal.requestNumber} · {formatPlatformDate(withdrawal.createdAt, { dateStyle: "medium" }, "fa-IR")}</p></div><Badge className={tomanWithdrawalStatus(withdrawal.status).className} variant="outline">{tomanWithdrawalStatus(withdrawal.status).label}</Badge></div>
                        {withdrawal.providerTrackingCode ? <p className="mt-2 text-xs text-muted-foreground">کد پیگیری: <span dir="ltr">{withdrawal.providerTrackingCode}</span></p> : null}
                        {withdrawal.rejectionReason ? <p className="mt-2 text-xs text-destructive">{withdrawal.rejectionReason}</p> : null}
                        {withdrawal.status === "PENDING_REVIEW" ? <Button className="mt-3" disabled={cancelWithdrawal.isPending} onClick={() => cancelWithdrawal.mutate(withdrawal.id)} size="sm" variant="outline">لغو درخواست</Button> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

      </div>

      <div className="space-y-5">
        <Card className="rounded-2xl border-border bg-card/85 shadow-elegant">
          <CardContent className="flex min-h-24 items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3"><span className="size-3 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,.14)]" /><span className="text-sm text-muted-foreground">قیمت لحظه‌ای ۱ گرم نقره عیار ۹۹۹</span></div>
            <strong className="shrink-0 text-xl">{formatToman(data.price.pricePerGram)}</strong>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card/85 shadow-elegant">
          <CardHeader><CardTitle className="text-2xl">خلاصه فعالیت‌های شما</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <WalletSummaryRow label="مجموع دارایی شما" value={formatToman(totalAsset)} />
            <WalletSummaryRow label="سود شما" tone={assetChange < 0 ? "negative" : assetChange > 0 ? "positive" : "default"} value={formatSignedToman(assetChange)} />
            <WalletSummaryRow label="اعتبار پاداش معرفی (فقط کارمزد)" value={formatToman(referralFeeCreditBalance)} />
            <WalletSummaryRow label="نقره برداشت‌شده" value={formatGram(withdrawnSilver)} />
            <WalletSummaryRow label="کارت هدیه‌های دریافت‌شده" value={formatToman(0)} />
            <WalletSummaryRow label="تومان در انتظار پردازش" value={formatToman(tomanWallet?.locked ?? 0)} />
            <WalletSummaryRow label="نقره در انتظار پردازش" value={formatGram(lockedSilver)} />
          </CardContent>
        </Card>

      </div>
    </section>

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <WalletAssetChart availableSilver={availableSilver} assetChange={assetChange} data={data} tomanBalance={tomanBalance} totalAsset={totalAsset} />
        <div id="verified-bank-accounts"><BankAccountsPanel /></div>
      </section>

      <Card className="rounded-2xl border-border bg-card/85 shadow-elegant">
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-2xl">لیست تراکنشات اخیر</CardTitle><p className="mt-1 text-xs text-muted-foreground">جستجو و مشاهده تمام گردش‌های کیف پول تومان و نقره</p></div>
            <Badge variant="secondary">{nf.format(transactions.data?.total ?? 0)} تراکنش</Badge>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_200px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="ps-9" onChange={(event) => { setTransactionPage(1); setTransactionSearch(event.target.value); }} placeholder="جستجو در شرح، کد پیگیری یا شناسه تراکنش" value={transactionSearch} />
            </div>
            <Select dir="rtl" onValueChange={(value) => { setTransactionPage(1); setTransactionStatus(value); }} value={transactionStatus}><SelectTrigger><Filter className="size-4" /><SelectValue placeholder="وضعیت" /></SelectTrigger><SelectContent><SelectItem value="ALL">همه وضعیت‌ها</SelectItem><SelectItem value="COMPLETED">تکمیل‌شده</SelectItem><SelectItem value="PENDING">در انتظار</SelectItem><SelectItem value="FAILED">ناموفق</SelectItem><SelectItem value="CANCELLED">لغوشده</SelectItem></SelectContent></Select>
            <Button onClick={() => { setTransactionPage(1); setTransactionSearch(""); setTransactionStatus("ALL"); setTransactionType("ALL"); }} variant="outline">پاک‌کردن فیلترها</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "همه", value: "ALL" },
              { label: "واریز", value: "DEPOSIT" },
              { label: "برداشت", value: "WITHDRAW" },
              { label: "خرید نقره", value: "BUY" },
              { label: "فروش نقره", value: "SELL" },
              { label: "هدیه", value: "GIFT" },
            ].map((item) => <button className={`rounded-full border px-4 py-2 text-xs transition ${transactionType === item.value ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"}`} key={item.value} onClick={() => { setTransactionPage(1); setTransactionType(item.value as "ALL" | SilverTransactionType); }} type="button">{item.label}</button>)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader><TableRow><TableHead>شرح تراکنش</TableHead><TableHead>نوع</TableHead><TableHead>وضعیت</TableHead><TableHead>تاریخ</TableHead><TableHead>مبلغ</TableHead><TableHead>مانده</TableHead><TableHead>مرجع</TableHead></TableRow></TableHeader>
              <TableBody>
                {transactions.isLoading ? <TableRow><TableCell className="h-32 text-center" colSpan={7}><Loader2 className="mx-auto size-5 animate-spin text-primary" /></TableCell></TableRow> : null}
                {!transactions.isLoading && transactions.data?.items.map((transaction) => {
                  const currency = walletTransactionCurrency(transaction, data.wallets);
                  const amount = formatWalletValue(Math.abs(Number(transaction.amount)), currency);
                  const balanceAfter = formatWalletValue(transaction.balanceAfter ?? 0, currency);
                  const isPositive = Number(transaction.amount) >= 0;
                  return <TableRow key={transaction.id}><TableCell><strong className="block min-w-48 text-sm">{transaction.description}</strong><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{transaction.id}</span></TableCell><TableCell><Badge variant="outline">{walletTransactionType(transaction.type)}</Badge></TableCell><TableCell><Badge variant="outline">{walletTransactionStatus(transaction.status)}</Badge></TableCell><TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatPlatformDate(transaction.createdAt, { dateStyle: "medium", timeStyle: "short" }, "fa-IR")}</TableCell><TableCell className={`whitespace-nowrap font-bold ${isPositive ? "text-emerald-600" : "text-destructive"}`}>{isPositive ? "+" : "−"}{amount}</TableCell><TableCell className="whitespace-nowrap text-xs">{balanceAfter}</TableCell><TableCell className="max-w-48 truncate font-mono text-xs text-muted-foreground">{transaction.reference ?? "—"}</TableCell></TableRow>;
                })}
                {!transactions.isLoading && !transactions.data?.items.length ? <TableRow><TableCell className="h-32 text-center text-sm text-muted-foreground" colSpan={7}>تراکنشی با این فیلترها پیدا نشد.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">صفحه {nf.format(transactions.data?.page ?? transactionPage)} از {nf.format(Math.max(transactions.data?.totalPages ?? 1, 1))}</p>
            <div className="flex gap-2"><Button disabled={transactionPage <= 1 || transactions.isFetching} onClick={() => setTransactionPage((page) => Math.max(1, page - 1))} size="sm" variant="outline">صفحه قبل</Button><Button disabled={transactionPage >= (transactions.data?.totalPages ?? 1) || transactions.isFetching} onClick={() => setTransactionPage((page) => page + 1)} size="sm" variant="outline">صفحه بعد</Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BankAccountsPanel() {
  const [iban, setIban] = useState("");
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryFn: getBankAccounts, queryKey: ["silver-bank-accounts"], retry: 1 });
  const addAccount = useMutation({
    mutationFn: () => createBankAccount({ iban }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "تأیید شماره شبا ناموفق بود."),
    onSuccess: () => {
      setIban("");
      toast.success("شماره شبا با احراز خودکار تأیید شد.");
      void queryClient.invalidateQueries({ queryKey: ["silver-bank-accounts"] });
    },
  });
  const removeAccount = useMutation({
    mutationFn: deleteBankAccount,
    onError: (error) => toast.error(error instanceof Error ? error.message : "حذف شماره شبا ناموفق بود."),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["silver-bank-accounts"] }),
  });

  return (
    <Card className="rounded-2xl border-border bg-card/85 shadow-elegant">
      <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-5 text-primary" />حساب‌های بانکی</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-muted-foreground">شماره شبای متعلق به خودتان را اضافه کنید. مالکیت حساب با کد ملی شما به‌صورت خودکار بررسی می‌شود و برداشت وجه فقط به حساب تأییدشده انجام خواهد شد.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input dir="ltr" onChange={(event) => setIban(event.target.value.toUpperCase())} placeholder="IR000000000000000000000000" value={iban} />
          <Button disabled={addAccount.isPending || !iban.trim()} onClick={() => addAccount.mutate()}>{addAccount.isPending ? <Loader2 className="size-4 animate-spin" /> : null}افزودن و احراز خودکار</Button>
        </div>
        {accounts.isLoading ? <ShadowSkeleton className="h-24 rounded-xl" /> : null}
        {accounts.data?.map((account) => (
          <div className="rounded-2xl border border-emerald-500/25 bg-[linear-gradient(135deg,rgba(16,185,129,.08),rgba(255,255,255,.02))] p-4" key={account.id}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><strong>{account.bankName ?? "حساب بانکی"}</strong><Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700" variant="outline"><BadgeCheck className="size-3.5" />تأیید مالکیت</Badge></div>
                <p className="mt-3 break-all font-mono text-sm" dir="ltr">{account.iban}</p>
                <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                  <div><span className="block text-[11px]">صاحب حساب</span><strong className="mt-1 block text-foreground">{account.ownerName ?? "مالک احرازشده"}</strong></div>
                  <div><span className="block text-[11px]">شماره حساب</span><strong className="mt-1 block font-mono text-foreground" dir="ltr">{account.accountNumber ?? "—"}</strong></div>
                  <div><span className="block text-[11px]">شماره کارت مرتبط</span><strong className="mt-1 block font-mono text-foreground" dir="ltr">{account.cardNumber ? maskBankNumber(account.cardNumber) : "—"}</strong></div>
                  <div><span className="block text-[11px]">نوع حساب</span><strong className="mt-1 block text-foreground">{account.accountType ?? "—"}</strong></div>
                  <div><span className="block text-[11px]">وضعیت حساب</span><strong className="mt-1 block text-foreground">{bankAccountStatus(account.accountStatus)}</strong></div>
                  <div><span className="block text-[11px]">کد بانک</span><strong className="mt-1 block font-mono text-foreground" dir="ltr">{account.bankCode ?? "—"}</strong></div>
                  <div><span className="block text-[11px]">مرجع احراز بانکی</span><strong className="mt-1 block break-all font-mono text-foreground" dir="ltr">{account.verificationReference ?? "—"}</strong></div>
                  <div><span className="block text-[11px]">تاریخ تأیید</span><strong className="mt-1 block text-foreground">{account.verifiedAt ? formatPlatformDate(account.verifiedAt, { dateStyle: "medium" }, "fa-IR") : "—"}</strong></div>
                </div>
              </div>
              <Button disabled={removeAccount.isPending} onClick={() => removeAccount.mutate(account.id)} size="sm" variant="outline">حذف حساب</Button>
            </div>
          </div>
        ))}
        {!accounts.isLoading && !accounts.data?.length ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">هنوز حساب بانکی تأییدشده‌ای ثبت نشده است.</p> : null}
      </CardContent>
    </Card>
  );
}

function WalletAssetChart({ availableSilver, assetChange, data, tomanBalance, totalAsset }: { availableSilver: number; assetChange: number; data: SilverOverview; tomanBalance: number; totalAsset: number }) {
  const history = useQuery({
    queryFn: () => getSilverPriceHistory(30),
    queryKey: ["wallet-asset-history", 30],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const rows = history.data ?? [];
  const values = rows.length
    ? rows.map((row) => tomanBalance + availableSilver * Number(row.sellPricePerGram))
    : [totalAsset, totalAsset];
  const coordinates = createChartCoordinates(values, { bottom: 82, top: 12 });
  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = coordinates.length ? `M ${coordinates.map((point) => `${point.x} ${point.y}`).join(" L ")} L 100 92 L 0 92 Z` : "";
  const dateLabels = rows.length
    ? [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]].map((row) => new Intl.DateTimeFormat("fa-IR", { day: "2-digit", month: "2-digit" }).format(new Date(row.createdAt)))
    : [];

  return (
    <Card className="rounded-2xl border-border bg-card/85 shadow-elegant">
      <CardHeader><CardTitle className="text-2xl">نمودار دارایی شما <small className="text-xs font-normal text-muted-foreground">(بر پایه تاریخچه قیمت نقره)</small></CardTitle></CardHeader>
      <CardContent>
        {history.isLoading ? <ShadowSkeleton className="h-60 rounded-xl" /> : (
          <>
            <div className="h-60 w-full" dir="ltr">
              <svg aria-label="نمودار ارزش دارایی" className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs><linearGradient id="wallet-asset-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#77b9ed" stopOpacity="0.85" /><stop offset="100%" stopColor="#77b9ed" stopOpacity="0.18" /></linearGradient></defs>
                <path d={areaPath} fill="url(#wallet-asset-fill)" />
                <polyline fill="none" points={linePoints} stroke="#4b94cc" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                <line stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" vectorEffect="non-scaling-stroke" x1="0" x2="100" y1="92" y2="92" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground" dir="rtl">{dateLabels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
          </>
        )}
        <div className="mt-5 flex items-center justify-end gap-5 border-b border-border pb-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-3 rounded-sm bg-[#77b9ed]" />نمودار نقره</span><span className="flex items-center gap-2"><i className="size-3 rounded-sm bg-slate-400" />موجودی تومان</span></div>
        <div className="grid gap-4 pt-4 text-center sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">مجموع دارایی شما</p><strong className="mt-1 block">{formatToman(totalAsset)}</strong></div><div><p className="text-sm text-muted-foreground">سود شما</p><strong className={`mt-1 block ${assetChange < 0 ? "text-destructive" : assetChange > 0 ? "text-emerald-600" : ""}`}>{formatSignedToman(assetChange)}</strong></div></div>
      </CardContent>
    </Card>
  );
}

function WalletSummaryRow({ label, tone = "default", value }: { label: string; tone?: "default" | "negative" | "positive"; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4 last:border-b-0"><span className="text-sm text-muted-foreground">{label}</span><strong className={tone === "negative" ? "text-destructive" : tone === "positive" ? "text-emerald-600" : ""}>{value}</strong></div>;
}

function tomanWithdrawalStatus(status: TomanWithdrawalStatus) {
  const statuses: Record<TomanWithdrawalStatus, { className: string; label: string }> = {
    APPROVED: { className: "border-sky-500/30 bg-sky-500/10 text-sky-700", label: "تأییدشده" },
    CANCELLED: { className: "border-border bg-muted text-muted-foreground", label: "لغوشده" },
    FAILED: { className: "border-destructive/30 bg-destructive/10 text-destructive", label: "ناموفق" },
    PAID: { className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700", label: "واریزشده" },
    PENDING_REVIEW: { className: "border-amber-500/30 bg-amber-500/10 text-amber-700", label: "در انتظار بررسی" },
    PROCESSING: { className: "border-violet-500/30 bg-violet-500/10 text-violet-700", label: "در حال انتقال" },
    REJECTED: { className: "border-destructive/30 bg-destructive/10 text-destructive", label: "ردشده" },
  };
  return statuses[status];
}

function formatSignedToman(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatToman(Math.abs(value))}`;
}

function maskBankNumber(value: string) {
  const compact = value.replace(/\s/g, "");
  if (compact.length <= 8) return compact;
  return `${compact.slice(0, 4)} •••• •••• ${compact.slice(-4)}`;
}

function bankAccountStatus(status?: string | null) {
  if (!status) return "تأییدشده";
  const normalizedStatus = status.replace(/[\s_-]/g, "").toUpperCase();
  return ({
    ACTIVE: "فعال",
    BLOCKED: "مسدود",
    CLOSED: "بسته",
    DISABLED: "غیرفعال",
    INACTIVE: "غیرفعال",
  } as Record<string, string>)[normalizedStatus] ?? status;
}

function walletTransactionStatus(status?: string) {
  return ({ CANCELLED: "لغوشده", COMPLETED: "تکمیل‌شده", FAILED: "ناموفق", PENDING: "در انتظار" } as Record<string, string>)[status ?? "COMPLETED"] ?? status;
}

function walletTransactionType(type: string) {
  return ({
    ADJUSTMENT: "اصلاح موجودی",
    BUY: "خرید نقره",
    DELIVERY: "تحویل",
    DEPOSIT: "واریز",
    FEE: "کارمزد",
    GIFT: "هدیه",
    PROMOTION: "اعتبار هدیه",
    REFERRAL: "پاداش معرفی",
    SELL: "فروش نقره",
    WITHDRAW: "برداشت",
  } as Record<string, string>)[type] ?? type;
}

function DeliveryPanel({ data }: { data: SilverOverview }) {
  const { lang } = useI18n();
  const searchParams = useSearchParams();
  const requestedGiftId = searchParams.get("gift") ?? "";
  const giftOverview = useQuery({ enabled: Boolean(requestedGiftId), queryFn: getGiftOverview, queryKey: ["customer-gifts"], retry: 1 });
  const giftedProduct = requestedGiftId
    ? giftOverview.data?.received.find((gift) => gift.id === requestedGiftId && gift.type === "SILVER_PRODUCT" && gift.status === "AVAILABLE")
    : undefined;
  const products = useQuery({ queryFn: () => getProducts(lang), queryKey: ["delivery-silver-products", lang] });
  const availableProducts = (products.data ?? []).filter((product) => product.id && product.silver?.weightGrams && (Number(product.silver.stockQuantity ?? 0) > 0 || product.id === giftedProduct?.productId));
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    const requestedProduct = searchParams.get("product");
    if (requestedProduct && availableProducts.some((product) => product.id === requestedProduct)) setProductId(requestedProduct);
  }, [availableProducts, searchParams]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const queryClient = useQueryClient();
  const recipientName = data.deliveryReceiver.name;
  const recipientMobile = data.deliveryReceiver.mobile;
  const receiverReady = Boolean(recipientName && recipientMobile && data.deliveryReceiver.mobileVerified);
  const selectedProduct = availableProducts.find((product) => product.id === productId);
  const deliveryQuantity = giftedProduct ? 1 : quantity;
  const productWeightGramsPerUnit = Number(selectedProduct?.silver?.weightGrams ?? 0);
  const productWeightGrams = productWeightGramsPerUnit * deliveryQuantity;
  const productFeeGramsPerUnit = Math.ceil((productWeightGramsPerUnit * Number(selectedProduct?.silver?.productFeePercent ?? 0) / 100) * 1_000) / 1_000;
  const productFeeGrams = giftedProduct ? 0 : productFeeGramsPerUnit * deliveryQuantity;
  const deliveryFeeGramsPerUnit = Number(data.price.deliveryFeeGrams);
  const deliveryFeeGrams = deliveryFeeGramsPerUnit * deliveryQuantity;
  const deliveryFeeToman = Number(data.price.deliveryFeeToman) * deliveryQuantity;
  const totalSilverDebit = giftedProduct ? deliveryFeeGrams : productWeightGrams + productFeeGrams + deliveryFeeGrams;
  const tomanWallet = data.wallets.find((wallet) => wallet.currency === "TOMAN");
  const silverWallet = data.wallets.find((wallet) => wallet.currency === "SILVER_GRAM");
  const delivery = useMutation({
    mutationFn: () => createDeliveryRequest({
      address,
      city,
      ...(giftedProduct ? { giftId: giftedProduct.id } : {}),
      postalCode,
      productId,
      quantity: deliveryQuantity,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ثبت درخواست تحویل ناموفق بود."),
    onSuccess: () => {
      toast.success("درخواست تحویل ثبت شد.");
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-gifts"] }),
      ]);
    },
  });
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <Card className="rounded-2xl border-border bg-card/70">
        <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="size-5 text-primary" />درخواست تحویل فیزیکی</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {requestedGiftId && giftedProduct ? <Alert className="border-fuchsia-500/30 bg-fuchsia-500/10"><Gift className="size-5 text-fuchsia-600" /><AlertTitle>دریافت محصول هدیه‌شده</AlertTitle><AlertDescription>هزینه محصول قبلاً توسط فرستنده پرداخت شده است؛ فقط هزینه ارسال پستی از موجودی نقره شما کسر می‌شود.</AlertDescription></Alert> : null}
          {requestedGiftId && !giftOverview.isLoading && !giftedProduct ? <Alert variant="destructive"><AlertTitle>هدیه برای تحویل در دسترس نیست</AlertTitle><AlertDescription>این هدیه قبلاً استفاده شده، لغو شده یا متعلق به حساب دیگری است. از صفحه هدیه‌های دریافتی دوباره بررسی کنید.</AlertDescription></Alert> : null}
          <div className="grid gap-3 rounded-xl border border-border bg-background/45 p-4 text-sm sm:grid-cols-2"><Row label="موجودی تومان" value={formatToman(tomanWallet?.balance ?? 0)} /><Row label="موجودی نقره" value={formatGram(silverWallet?.balance ?? data.holding.availableGrams)} /></div>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="انتخاب محصول نقره" /></SelectTrigger><SelectContent>{availableProducts.map((product) => <SelectItem key={product.id} value={product.id!}>{product.title[lang]} · {formatGram(product.silver?.weightGrams ?? 0)}</SelectItem>)}</SelectContent></Select>
            <Input disabled={Boolean(giftedProduct)} inputMode="numeric" max={selectedProduct?.silver?.stockQuantity ?? 1} min={1} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} type="number" value={deliveryQuantity} />
          </div>
          {!products.isLoading && !availableProducts.length ? <Alert><AlertTitle>محصول قابل تحویل موجود نیست</AlertTitle><AlertDescription>ابتدا موجودی محصولات نقره باید توسط مدیریت ثبت شود.</AlertDescription></Alert> : null}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-sm font-bold">گیرنده ثابت حساب کاربری</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input disabled value={recipientName} placeholder="نام حساب کاربری" /><Input dir="ltr" disabled value={recipientMobile} placeholder="موبایل تأییدشده حساب" /></div>
            <p className="mt-2 text-xs text-muted-foreground">برای امنیت دارایی، نام و موبایل گیرنده در درخواست تحویل قابل ویرایش نیست.</p>
            {!receiverReady ? <Button asChild className="mt-3" size="sm" variant="outline"><Link href="/user/profile">تکمیل نام و موبایل تأییدشده</Link></Button> : null}
          </div>
          <div className="rounded-xl border border-border bg-background/45 p-3 text-sm"><strong>روش تحویل:</strong> ارسال پستی بیمه‌شده</div>
          <div className="grid gap-3 sm:grid-cols-2"><Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="شهر" /><Input dir="ltr" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="کد پستی" /></div><Textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="آدرس کامل ارسال" />
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm leading-7">
            <Row label={giftedProduct ? "محصول پرداخت‌شده توسط فرستنده" : "نقره خالص محصول"} value={giftedProduct ? "پرداخت شده" : formatGram(productWeightGrams)} />
            <Row label="کارمزد ساخت و بسته‌بندی" value={giftedProduct ? "پرداخت شده" : `${formatGram(productFeeGrams)} (${formatGram(productFeeGramsPerUnit)} × ${toFa(deliveryQuantity)})`} />
            <Row label="هزینه تحویل به نقره" value={`${formatGram(deliveryFeeGrams)} (${formatGram(deliveryFeeGramsPerUnit)} × ${toFa(deliveryQuantity)})`} />
            <Row label="مجموع کسر از نقره" value={formatGram(totalSilverDebit)} />
            <p className="mt-2 text-xs text-muted-foreground">هزینه تحویل هر واحد {formatToman(data.price.deliveryFeeToman)} و برای این تعداد مجموعاً {formatToman(deliveryFeeToman)} است؛ معادل نقره هر واحد به بالا تا سه رقم اعشار محاسبه می‌شود.</p>
            <p className="mt-1">زمان تخمینی: {toFa(data.price.deliveryWorkingDays)} روز کاری</p>
          </div>
          <Button className="w-full" disabled={delivery.isPending || !productId || !receiverReady || !city.trim() || !postalCode.trim() || !address.trim() || (!giftedProduct && quantity > Number(selectedProduct?.silver?.stockQuantity ?? 0)) || totalSilverDebit > Number(silverWallet?.balance ?? data.holding.availableGrams) || Boolean(requestedGiftId && !giftedProduct)} onClick={() => delivery.mutate()}>
            {delivery.isPending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
            ثبت درخواست تحویل
          </Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border bg-card/70">
        <CardHeader><CardTitle>پیگیری تحویل</CardTitle></CardHeader>
        <CardContent><DeliveryTable data={data} /></CardContent>
      </Card>
    </section>
  );
}

function AccountCredentialsPanel() {
  const { refreshUser, user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const hasPassword = Boolean(user?.authMethods?.password);
  const emailVerified = Boolean(user?.emailVerifiedAt);

  useEffect(() => setEmail(user?.email ?? ""), [user?.email]);

  const requestEmail = useMutation({
    mutationFn: async () => {
      const result = await platformAuth.requestContactEmail(email.trim());
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ارسال کد ایمیل انجام نشد."),
    onSuccess: () => { setEmailCodeSent(true); toast.success("کد تأیید به ایمیل ارسال شد."); },
  });
  const verifyEmail = useMutation({
    mutationFn: async () => {
      const result = await platformAuth.verifyContactEmail({ code: emailCode, email: email.trim() });
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تأیید ایمیل انجام نشد."),
    onSuccess: async () => { await refreshUser(); setEmailCode(""); setEmailCodeSent(false); toast.success("ایمیل تأیید و به حساب اضافه شد."); },
  });
  const savePassword = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("رمز عبور و تکرار آن یکسان نیستند.");
      const result = hasPassword
        ? await platformAuth.changePassword({ currentPassword, newPassword })
        : await platformAuth.setPassword({ confirmPassword, password: newPassword });
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ذخیره رمز عبور انجام نشد."),
    onSuccess: async () => { await refreshUser(); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); toast.success(hasPassword ? "رمز عبور تغییر کرد." : "رمز عبور به حساب اضافه شد."); },
  });

  return (
    <Card className="rounded-2xl border-border bg-card/70">
      <CardHeader><CardTitle className="flex items-center gap-2"><BadgeCheck className="size-5 text-primary" />اطلاعات ورود به حساب</CardTitle></CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-background/35 p-4">
          <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 font-semibold"><Mail className="size-4 text-primary" />ایمیل <span className="text-xs font-normal text-muted-foreground">(اختیاری)</span></p><Badge variant={emailVerified ? "default" : "outline"}>{emailVerified ? "تأییدشده" : email ? "تأییدنشده" : "ثبت نشده"}</Badge></div>
          <Input disabled={emailVerified} dir="ltr" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" value={email} />
          {!emailVerified ? <>{emailCodeSent ? <Input dir="ltr" inputMode="numeric" maxLength={6} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ""))} placeholder="کد تأیید ۶ رقمی" value={emailCode} /> : null}<Button className="w-full" disabled={requestEmail.isPending || verifyEmail.isPending || (emailCodeSent ? emailCode.length !== 6 : !email.trim())} onClick={() => emailCodeSent ? verifyEmail.mutate() : requestEmail.mutate()} type="button" variant="outline">{(requestEmail.isPending || verifyEmail.isPending) ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}{emailCodeSent ? "تأیید و افزودن ایمیل" : "ارسال کد تأیید ایمیل"}</Button></> : <p className="text-xs text-muted-foreground">ورود با این ایمیل و دریافت کد ایمیلی فعال است.</p>}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-background/35 p-4">
          <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 font-semibold"><KeyRound className="size-4 text-primary" />رمز عبور <span className="text-xs font-normal text-muted-foreground">(اختیاری)</span></p><Badge variant={hasPassword ? "default" : "outline"}>{hasPassword ? "فعال" : "تنظیم نشده"}</Badge></div>
          {hasPassword ? <Input autoComplete="current-password" onChange={(event) => setCurrentPassword(event.target.value)} placeholder="رمز عبور فعلی" type="password" value={currentPassword} /> : <p className="text-xs leading-6 text-muted-foreground">با افزودن رمز می‌توانید علاوه بر OTP یا ورود اجتماعی، با ایمیل/موبایل و رمز نیز وارد شوید.</p>}
          <Input autoComplete="new-password" onChange={(event) => setNewPassword(event.target.value)} placeholder={hasPassword ? "رمز عبور جدید" : "رمز عبور (حداقل ۸ کاراکتر)"} type="password" value={newPassword} />
          <Input autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="تکرار رمز عبور" type="password" value={confirmPassword} />
          <Button className="w-full" disabled={savePassword.isPending || newPassword.length < 8 || newPassword !== confirmPassword || (hasPassword && !currentPassword)} onClick={() => savePassword.mutate()} type="button">{savePassword.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}{hasPassword ? "تغییر رمز عبور" : "افزودن رمز عبور"}</Button>
        </div>

        <div className="grid gap-2 rounded-xl border border-border bg-background/35 p-4 text-sm sm:grid-cols-[auto_1fr_auto] sm:items-center lg:col-span-2"><span className="flex items-center gap-2 font-semibold"><Smartphone className="size-4 text-primary" />شماره موبایل</span><span className="sm:text-center" dir="ltr">{user?.mobile ?? "ثبت نشده"}</span><Badge variant={user?.mobileVerifiedAt ? "default" : "outline"}>{user?.mobileVerifiedAt ? "تأییدشده" : "تأییدنشده"}</Badge></div>
      </CardContent>
    </Card>
  );
}

function KycPanel({ data }: { data: SilverOverview }) {
  const { lang } = useI18n();
  const { refreshUser, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.profile?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.profile?.lastName ?? "");
  const [idCardNo, setIdCardNo] = useState(user?.profile?.idCardNo ?? "");
  const [verificationMobile, setVerificationMobile] = useState(user?.mobile ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setFirstName(user?.profile?.firstName ?? "");
    setLastName(user?.profile?.lastName ?? "");
    setIdCardNo(user?.profile?.idCardNo ?? "");
  }, [user?.profile?.firstName, user?.profile?.idCardNo, user?.profile?.lastName]);

  const profileComplete = Boolean(firstName.trim() && lastName.trim() && /^\d{10}$/.test(idCardNo.trim()));
  const kyc = useMutation({
    mutationFn: () => submitKycProfile({ firstName: firstName.trim(), lastName: lastName.trim(), nationalId: idCardNo.trim() }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ثبت احراز هویت ناموفق بود."),
    onSuccess: async () => {
      await refreshUser();
      toast.success("اطلاعات هویتی تأیید و ذخیره شد.");
      await queryClient.invalidateQueries({ queryKey: ["silver-dashboard-overview"] });
    },
  });
  const requestMobileVerification = useMutation({
    mutationFn: async () => {
      const result = await platformAuth.requestContactMobile(verificationMobile);
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ارسال کد تأیید انجام نشد."),
    onSuccess: () => { setVerificationSent(true); toast.success("کد تأیید پیامکی ارسال شد."); },
  });
  const verifyMobile = useMutation({
    mutationFn: async () => {
      const result = await platformAuth.verifyContactMobile({ code: verificationCode, mobile: verificationMobile });
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تأیید شماره موبایل انجام نشد."),
    onSuccess: async () => { await refreshUser(); setVerificationCode(""); setVerificationSent(false); toast.success("شماره موبایل تأیید شد. اکنون می‌توانید احراز هویت را ادامه دهید."); },
  });
  if (!user?.mobileVerifiedAt) {
    return (
      <div className="space-y-4">
        <AccountCredentialsPanel />
        <Card className="rounded-2xl border-border bg-card/70">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" />پیش‌نیاز احراز هویت</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Alert><AlertTitle>شماره موبایل حساب هنوز تأیید نشده است</AlertTitle><AlertDescription>ابتدا شماره‌ای را که متعلق به صاحب کد ملی است با کد پیامکی به همین حساب متصل کنید. سپس احراز خودکار فعال می‌شود.</AlertDescription></Alert>
            <Input dir="ltr" inputMode="tel" onChange={(event) => setVerificationMobile(event.target.value)} placeholder="09121234567" value={verificationMobile} />
            {verificationSent ? <Input dir="ltr" inputMode="numeric" maxLength={6} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} placeholder="کد تأیید ۶ رقمی" value={verificationCode} /> : null}
            <Button disabled={requestMobileVerification.isPending || verifyMobile.isPending || (verificationSent ? verificationCode.length !== 6 : !verificationMobile.trim())} onClick={() => verificationSent ? verifyMobile.mutate() : requestMobileVerification.mutate()} type="button">
              {(requestMobileVerification.isPending || verifyMobile.isPending) ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {verificationSent ? "تأیید شماره موبایل" : "ارسال کد تأیید موبایل"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <AccountCredentialsPanel />
      <Card className="rounded-2xl border-border bg-card/70">
      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" />پروفایل و احراز هویت</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="kyc-first-name">نام</label><Input disabled={data.kyc?.status === "APPROVED"} id="kyc-first-name" onChange={(event) => setFirstName(event.target.value)} value={firstName} /></div>
        <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="kyc-last-name">نام خانوادگی</label><Input disabled={data.kyc?.status === "APPROVED"} id="kyc-last-name" onChange={(event) => setLastName(event.target.value)} value={lastName} /></div>
        <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold" htmlFor="kyc-id-card">کد ملی</label><Input disabled={data.kyc?.status === "APPROVED"} dir="ltr" id="kyc-id-card" inputMode="numeric" maxLength={10} onChange={(event) => setIdCardNo(event.target.value.replace(/\D/g, ""))} placeholder="0012345678" value={idCardNo} /><p className="text-xs text-muted-foreground">کد ملی باید ۱۰ رقم باشد و پس از تأیید احراز خودکار قابل تغییر نیست.</p></div>
        <div className="rounded-xl border border-border bg-background/45 p-3 text-sm md:col-span-2">با ثبت این فرم، ابتدا تعلق شماره موبایل حساب به کد ملی بررسی می‌شود. اطلاعات فقط پس از تأیید موفق ذخیره خواهد شد.</div>
        <div className="rounded-xl border border-border bg-background/45 p-3 text-sm">وضعیت فعلی: {translateUiText(data.kyc?.status ?? "ثبت نشده", lang)}</div>
        <Button disabled={!profileComplete || kyc.isPending || data.kyc?.status === "APPROVED"} onClick={() => kyc.mutate()}>
          {kyc.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {data.kyc?.status === "APPROVED" ? "احراز هویت تأیید شده" : "بررسی، تأیید و ذخیره اطلاعات"}
        </Button>
      </CardContent>
      </Card>
    </div>
  );
}

function OrdersPanel({ compact = false, data }: { compact?: boolean; data: SilverOverview }) {
  const { lang } = useI18n();
  const rows = compact ? data.recentOrders.slice(0, 5) : data.recentOrders;
  return (
    <Card className="rounded-2xl border-border bg-card/70">
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" />سفارش‌ها</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>شماره</TableHead><TableHead>نوع</TableHead><TableHead>گرم</TableHead><TableHead>مبلغ</TableHead><TableHead>وضعیت</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length ? rows.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.type === "BUY" ? "خرید" : "فروش"}</TableCell>
                <TableCell>{formatGram(order.grams)}</TableCell>
                <TableCell>{formatToman(order.totalToman)}</TableCell>
                <TableCell><Badge variant="outline">{translateUiText(order.status, lang)}</Badge></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={5}>هنوز سفارشی ثبت نشده است.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TransactionsPanel({ compact = false, data }: { compact?: boolean; data: SilverOverview }) {
  const { lang } = useI18n();
  const rows = compact ? data.transactions.slice(0, 5) : data.transactions;
  return (
    <Card className="rounded-2xl border-border bg-card/70">
      <CardHeader><CardTitle>تراکنش‌ها</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>شرح</TableHead><TableHead>مقدار</TableHead><TableHead>زمان</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length ? rows.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.description}</TableCell>
                <TableCell>{formatWalletTransactionAmount(tx, data.wallets)}</TableCell>
                <TableCell>{formatDate(tx.createdAt, lang)}</TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={3}>تراکنشی وجود ندارد.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PaymentDetailPanel({ paymentId }: { paymentId: string }) {
  const payment = useQuery({
    queryFn: () => getCustomerPaymentDetail(paymentId),
    queryKey: ["customer-payment-detail", paymentId],
    retry: 1,
  });

  if (payment.isLoading) return <ShadowSkeleton className="h-80 rounded-2xl" />;
  if (payment.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>جزئیات پرداخت در دسترس نیست</AlertTitle>
        <AlertDescription>{payment.error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!payment.data) return null;

  return <PaymentDetailsCard payment={payment.data} />;
}

function PaymentDetailsCard({ payment }: { payment: CustomerPaymentDetail }) {
  return (
    <Card className="rounded-2xl border-border bg-card/85 shadow-elegant">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-2xl">پرداخت {payment.paymentNumber}</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">ثبت‌شده در {formatPlatformDate(payment.createdAt, { dateStyle: "medium", timeStyle: "short" }, "fa-IR")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{payment.gateway === "zarinpal" ? "زرین‌پال" : payment.gateway}</Badge>
          <Badge className={paymentStatus(payment.status).className} variant="outline">{paymentStatus(payment.status).label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PaymentDetailFact label="مبلغ" value={formatPaymentAmount(payment.amount, payment.currency)} />
          <PaymentDetailFact label="شماره فاکتور" value={payment.invoice?.invoiceNumber ?? "—"} />
          <PaymentDetailFact label="شماره سفارش" value={payment.order?.orderNumber ?? "—"} />
          <PaymentDetailFact label="کد مرجع زرین‌پال" value={payment.referenceId ?? "—"} />
        </div>

        {payment.failureReason ? (
          <Alert variant="destructive">
            <AlertTitle>پرداخت تأیید نشده است</AlertTitle>
            <AlertDescription>{payment.failureReason}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <PaymentDetailRow label="وضعیت فاکتور" value={payment.invoice ? paymentStatus(payment.invoice.status).label : "—"} />
            <PaymentDetailRow label="زمان تأیید" value={payment.verifiedAt ? formatPlatformDate(payment.verifiedAt, { dateStyle: "medium", timeStyle: "short" }, "fa-IR") : "—"} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild><Link href="/user/transactions"><FileText className="size-4" />بازگشت به تراکنش‌ها</Link></Button>
          <Button asChild variant="outline"><Link href="/user/wallet"><Wallet className="size-4" />دارایی و کیف پول</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentDetailFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/40 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words font-bold">{value}</p></div>;
}

function PaymentDetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}

function DeliveryTable({ data }: { data: SilverOverview }) {
  const { lang } = useI18n();
  return (
    <Table>
      <TableHeader><TableRow><TableHead>شماره</TableHead><TableHead>محصول</TableHead><TableHead>تعداد</TableHead><TableHead>وضعیت</TableHead><TableHead>تحویل تخمینی</TableHead></TableRow></TableHeader>
      <TableBody>
        {data.deliveryRequests.length ? data.deliveryRequests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{request.requestNumber}</TableCell>
            <TableCell>{request.productTitle ?? "محصول نقره"}</TableCell>
            <TableCell>{request.quantity ?? 1}</TableCell>
            <TableCell><Badge variant="outline">{translateUiText(request.status, lang)}</Badge></TableCell>
            <TableCell>{formatDate(request.estimatedAt ?? request.requestedAt ?? request.createdAt, lang)}</TableCell>
          </TableRow>
        )) : <TableRow><TableCell colSpan={5}>درخواست تحویلی ثبت نشده است.</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
}

function StatCard({ icon: Icon, label, meta, value }: { icon: typeof Coins; label: string; meta: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="size-4" /></span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <ShadowSkeleton className="h-36 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-32 rounded-2xl" key={index} />)}
      </div>
    </div>
  );
}

function ticketIdFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.findIndex((part) => part === "tickets");
  const next = index >= 0 ? parts[index + 1] : undefined;
  return next && next !== "open" ? next : undefined;
}

function liveChatIdFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.findIndex((part) => part === "live-chat");
  return index >= 0 ? parts[index + 1] : undefined;
}

function paymentIdFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "user" || parts[1] !== "payments") return undefined;
  try {
    return decodeURIComponent(parts[2]);
  } catch {
    return undefined;
  }
}

function formatWalletTransactionAmount(
  transaction: SilverOverview["transactions"][number],
  wallets: SilverOverview["wallets"],
) {
  return formatWalletValue(transaction.amount, walletTransactionCurrency(transaction, wallets));
}

function walletTransactionCurrency(
  transaction: SilverOverview["transactions"][number],
  wallets: SilverOverview["wallets"],
) {
  return transaction.wallet?.currency
    ?? wallets.find((wallet) => wallet.id === transaction.walletId)?.currency;
}

function formatWalletValue(value: number | string | null | undefined, currency?: "SILVER_GRAM" | "TOMAN") {
  if (currency === "TOMAN") return formatToman(value);
  if (currency === "SILVER_GRAM") return formatGram(value);
  return `${nf.format(toFiniteNumber(value))} واحد نامشخص`;
}

function formatPaymentAmount(value: number | string | null | undefined, currency: string) {
  const normalized = currency.trim().toUpperCase();
  if (["IRR", "RIAL", "IRT", "TOMAN", "تومان", "ریال"].includes(normalized)) {
    return formatTomanMoney(value, normalized);
  }
  if (normalized === "SILVER_GRAM") return formatGram(value);
  return `${nf.format(toFiniteNumber(value))} ${currency}`;
}

function paymentStatus(status: string) {
  const statuses: Record<string, { className: string; label: string }> = {
    CANCELLED: { className: "border-border bg-muted text-muted-foreground", label: "لغوشده" },
    CREATED: { className: "border-sky-500/30 bg-sky-500/10 text-sky-700", label: "ایجادشده" },
    EXPIRED: { className: "border-border bg-muted text-muted-foreground", label: "منقضی‌شده" },
    FAILED: { className: "border-destructive/30 bg-destructive/10 text-destructive", label: "ناموفق" },
    OVERDUE: { className: "border-destructive/30 bg-destructive/10 text-destructive", label: "سررسید گذشته" },
    PAID: { className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700", label: "پرداخت‌شده" },
    PENDING: { className: "border-amber-500/30 bg-amber-500/10 text-amber-700", label: "در انتظار" },
    PROCESSING: { className: "border-violet-500/30 bg-violet-500/10 text-violet-700", label: "در حال پردازش" },
    REFUNDED: { className: "border-sky-500/30 bg-sky-500/10 text-sky-700", label: "بازپرداخت‌شده" },
    VERIFYING: { className: "border-violet-500/30 bg-violet-500/10 text-violet-700", label: "در حال تأیید" },
  };
  return statuses[status] ?? { className: "border-border", label: status };
}

function formatToman(value: number | string | null | undefined) {
  return `${nf.format(Math.round(toFiniteNumber(value)))} تومان`;
}

function formatGram(value: number | string | null | undefined) {
  const amount = toFiniteNumber(value);
  return `${nf.format(Math.round(amount * 1_000) / 1_000)} گرم`;
}

function toFiniteNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeTradeIntegerInput(value: string) {
  return toLatinNumericInput(value).replace(/\D/g, "");
}

function normalizeTradeDecimalInput(value: string) {
  return toLatinNumericInput(value)
    .replace(/[٫,]/g, ".")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1");
}

function toLatinNumericInput(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : arabicDigits.indexOf(digit));
  });
}

function formatTradeInput(value: number, maximumFractionDigits: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  const fixed = value.toFixed(maximumFractionDigits);
  return maximumFractionDigits ? fixed.replace(/\.?0+$/, "") : fixed;
}

function formatDate(value?: string, lang: string = "fa") {
  if (!value) return "-";
  return formatPlatformDate(value, undefined, lang);
}

function toFa(value: number | string) {
  return nf.format(Number(value));
}
