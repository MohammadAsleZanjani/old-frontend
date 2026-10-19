"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Coins, ReceiptText, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { getAdminSilverOrder } from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminSilverOrderDetailPage({ orderId }: { orderId: string }) {
  const { lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const order = useQuery({ queryFn: () => getAdminSilverOrder(orderId), queryKey: ["admin-silver-order", orderId], retry: 1 });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("silver.orders.view"));

  if (overview.isLoading || order.isLoading) {
    return <AdminShell><div className="space-y-4"><ShadowSkeleton className="h-28" /><ShadowSkeleton className="h-72" /></div></AdminShell>;
  }
  const error = overview.error ?? order.error;
  if (error || !order.data) {
    return <AdminShell><Alert variant="destructive"><AlertTitle>سفارش نقره در دسترس نیست</AlertTitle><AlertDescription>{error?.message ?? "سفارش پیدا نشد."}</AlertDescription></Alert></AdminShell>;
  }

  const data = order.data;
  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">سفارش خرید و فروش نقره</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">سفارش {data.orderNumber}</h2>
            <p className="text-sm text-muted-foreground">ثبت‌شده در {formatPlatformDate(data.createdAt, { dateStyle: "medium", timeStyle: "medium" })}</p>
          </div>
          <Button asChild variant="outline"><Link href="/admin/silver/orders"><ArrowRight className="size-4" />بازگشت به سفارش‌ها</Link></Button>
        </section>
        {!allowed ? <Alert><AlertTitle>مجوز لازم است</AlertTitle><AlertDescription>نقش فعلی شما اجازه مشاهده جزئیات این سفارش را ندارد.</AlertDescription></Alert> : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Coins} label="نوع معامله" value={data.type === "BUY" ? "خرید نقره" : "فروش نقره"} />
          <Metric icon={ReceiptText} label="وضعیت" value={t(data.status)} />
          <Metric icon={Coins} label="وزن" value={`${formatNumber(data.grams)} گرم`} />
          <Metric icon={ReceiptText} label="روش پرداخت" value={data.paymentMethod === "GATEWAY" ? "درگاه بانکی" : data.paymentMethod === "WALLET" ? "کیف پول تومان" : "ثبت نشده"} />
          <Metric icon={UserRound} label="مبلغ نهایی" value={`${formatNumber(data.totalToman)} تومان`} />
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg bg-card/70">
            <CardHeader><CardTitle>جزئیات قیمت</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="قیمت هر گرم" value={`${formatNumber(data.pricePerGram)} تومان`} />
              <Detail label="ارزش خام معامله" value={`${formatNumber(data.grossAmount)} تومان`} />
              <Detail label="کارمزد" value={`${formatNumber(data.feeAmount)} تومان`} />
              <Detail label="وزن معامله" value={`${formatNumber(data.grams)} گرم`} />
              <Detail label="مبلغ نهایی سفارش" value={`${formatNumber(data.totalToman)} تومان`} />
              {data.rejectionReason ? <Detail label="دلیل رد" value={data.rejectionReason} /> : null}
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card/70">
            <CardHeader><CardTitle>زمان‌بندی سفارش</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="کاربر" value={<AdminUserLink userId={data.user.id}>{userName(data.user)}</AdminUserLink>} />
              <Detail label="موبایل / ایمیل" value={data.user.mobile ?? data.user.email ?? "—"} />
              <Detail label="ایجاد" value={exactDate(data.createdAt)} />
              <Detail label="زمان دقیق تراکنش" value={exactDate(data.transactionAt)} />
              <Detail label="آخرین بروزرسانی" value={exactDate(data.updatedAt)} />
              {data.completedAt ? <Detail label="تکمیل" value={exactDate(data.completedAt)} /> : null}
              {data.cancelledAt ? <Detail label="لغو" value={exactDate(data.cancelledAt)} /> : null}
              {data.transactionReference ? <Detail label="شناسه تراکنش" value={data.transactionReference} /> : null}
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-lg bg-card/70">
          <CardHeader><CardTitle>پرداخت‌های متصل به سفارش</CardTitle></CardHeader>
          <CardContent>
            {data.payments.length ? (
              <Table><TableHeader><TableRow><TableHead>شماره پرداخت</TableHead><TableHead>روش / درگاه</TableHead><TableHead>مبلغ</TableHead><TableHead>وضعیت</TableHead><TableHead>شناسه‌های بانکی</TableHead><TableHead>زمان دقیق</TableHead></TableRow></TableHeader>
                <TableBody>{data.payments.map((payment) => <TableRow key={payment.id}><TableCell><p className="font-semibold">{payment.paymentNumber}</p><p className="font-mono text-[11px] text-muted-foreground" dir="ltr">{payment.id}</p></TableCell><TableCell>{payment.gateway === "wallet" ? "کیف پول تومان" : `درگاه بانکی · ${payment.gateway}`}{payment.cardPan ? <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{payment.cardPan}</p> : null}</TableCell><TableCell className="font-bold">{formatNumber(payment.amount)} تومان</TableCell><TableCell><Badge variant="outline">{t(payment.status)}</Badge>{payment.failureReason ? <p className="mt-1 text-xs text-destructive">{payment.failureReason}</p> : null}</TableCell><TableCell className="font-mono text-xs" dir="ltr">{payment.referenceId ?? payment.transactionId ?? payment.authority ?? "—"}</TableCell><TableCell>{exactDate(payment.paidAt ?? payment.verifiedAt ?? payment.failedAt ?? payment.createdAt)}</TableCell></TableRow>)}</TableBody>
              </Table>
            ) : <div className="grid min-h-32 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">برای این سفارش پرداخت بانکی جداگانه‌ای ثبت نشده است.</div>}
          </CardContent>
        </Card>
        <Card className="rounded-lg bg-card/70">
          <CardHeader><CardTitle>گردش‌های کیف پول این سفارش</CardTitle></CardHeader>
          <CardContent>
            {data.transactions.length ? (
              <Table><TableHeader><TableRow><TableHead>شرح</TableHead><TableHead>نوع</TableHead><TableHead>مبلغ/وزن</TableHead><TableHead>موجودی پس از عملیات</TableHead><TableHead>وضعیت</TableHead><TableHead>زمان دقیق</TableHead></TableRow></TableHeader>
                <TableBody>{data.transactions.map((transaction) => <TableRow key={transaction.id}><TableCell>{transaction.description}<p className="font-mono text-[11px] text-muted-foreground" dir="ltr">{transaction.id}</p></TableCell><TableCell>{t(transaction.type)}</TableCell><TableCell>{formatNumber(transaction.amount)} {transaction.wallet.currency === "TOMAN" ? "تومان" : "گرم"}</TableCell><TableCell>{formatNumber(transaction.balanceAfter)} {transaction.wallet.currency === "TOMAN" ? "تومان" : "گرم"}</TableCell><TableCell><Badge variant="outline">{t(transaction.status)}</Badge></TableCell><TableCell>{exactDate(transaction.createdAt)}</TableCell></TableRow>)}</TableBody>
              </Table>
            ) : <div className="grid min-h-32 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">گردش کیف پولی برای این سفارش ثبت نشده است.</div>}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return <Card className="rounded-lg bg-card/70"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4" />{label}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{value}</div></CardContent></Card>;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-end font-medium">{value}</span></div>;
}

function exactDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "medium" });
}

function userName(user: { email?: string | null; mobile?: string | null; profile?: { firstName?: string | null; lastName?: string | null } | null }) {
  return [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.mobile || user.email || "کاربر";
}

function formatNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("fa-IR", { maximumFractionDigits: 3 }) : value;
}
