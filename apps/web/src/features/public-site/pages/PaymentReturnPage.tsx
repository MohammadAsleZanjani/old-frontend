"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

import { getCustomerPaymentDetail } from "@/features/customer-dashboard/api/customer-dashboard-api";
import { SiteBackground } from "@/features/public-site/sections/Background";
import { Footer } from "@/features/public-site/sections/Footer";
import { Header } from "@/features/silver-platform/components";
import { useAuth } from "@/shared/auth/AuthProvider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

type PaymentReturnKind = "canceled" | "failed" | "pending" | "success";

export function PaymentReturnPage({ expected, paymentId }: { expected: PaymentReturnKind; paymentId?: string }) {
  const { loading: authLoading, user } = useAuth();
  const payment = useQuery({
    enabled: Boolean(paymentId && user),
    queryFn: () => getCustomerPaymentDetail(paymentId ?? ""),
    queryKey: ["payment-return", paymentId],
    refetchInterval: ({ state }) => ["CREATED", "PENDING", "PROCESSING", "VERIFYING"].includes(state.data?.status ?? "") ? 3000 : false,
  });

  const kind = payment.data?.status === "PAID"
    ? "success"
    : payment.data?.status === "CANCELLED"
      ? "canceled"
      : payment.data && ["FAILED", "EXPIRED"].includes(payment.data.status)
        ? "failed"
        : payment.data
          ? "pending"
          : expected;
  const content = resultContent(kind);
  const Icon = content.icon;

  return (
    <main className="relative min-h-screen text-foreground">
      <SiteBackground />
      <Header />
      <section className="relative px-6 pb-24 pt-36">
        <Card className="mx-auto max-w-xl rounded-3xl border-border bg-card/80 shadow-[0_24px_80px_-42px_var(--glow)] backdrop-blur-xl">
          <CardContent className="flex flex-col items-center p-8 text-center md:p-12">
            <span className={`grid size-20 place-items-center rounded-full ${content.iconClass}`}>
              <Icon className="size-11" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-black">{content.title}</h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">{content.description}</p>

            {authLoading || payment.isLoading ? <Loader2 className="mt-6 size-6 animate-spin text-primary" /> : null}
            {payment.data ? (
              <dl className="mt-7 w-full space-y-3 rounded-2xl border border-border bg-background/40 p-5 text-sm">
                <PaymentFact label="شماره پرداخت" value={payment.data.paymentNumber} />
                <PaymentFact label="شماره سفارش" value={payment.data.order?.orderNumber ?? "—"} />
                {payment.data.referenceId ? <PaymentFact label="کد مرجع زرین‌پال" value={payment.data.referenceId} /> : null}
              </dl>
            ) : null}
            {!authLoading && !user ? <p className="mt-6 text-sm text-muted-foreground">برای مشاهده جزئیات پرداخت وارد حساب خود شوید.</p> : null}
            {payment.isError ? <p className="mt-6 text-sm text-destructive">جزئیات پرداخت در دسترس نیست؛ می‌توانید وضعیت را از حساب کاربری بررسی کنید.</p> : null}

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              {user && payment.data ? (
                <Button asChild><Link href={`/user/payments/${payment.data.id}` as never}>مشاهده جزئیات پرداخت</Link></Button>
              ) : (
                <Button asChild><Link href={`/auth?redirect=${encodeURIComponent(`/payment/${expected}?paymentId=${paymentId ?? ""}`)}` as never}>ورود به حساب</Link></Button>
              )}
              <Button asChild variant="outline"><Link href={"/user/product-orders" as never}>سفارش‌های من</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <Footer />
    </main>
  );
}

function PaymentFact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono font-semibold">{value}</dd></div>;
}

function resultContent(kind: PaymentReturnKind) {
  if (kind === "success") return {
    description: "پرداخت پس از استعلام مستقیم از زرین‌پال تأیید شد و سفارش وارد مرحله پردازش شده است.",
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/15 text-emerald-500",
    title: "پرداخت موفق",
  };
  if (kind === "canceled") return {
    description: "پرداخت در درگاه لغو شد و مبلغی برای این تلاش تأیید نشده است. می‌توانید از صفحه سفارش دوباره پرداخت کنید.",
    icon: XCircle,
    iconClass: "bg-amber-500/15 text-amber-500",
    title: "پرداخت لغو شد",
  };
  if (kind === "pending") return {
    description: "پاسخ درگاه دریافت شده اما تأیید نهایی هنوز کامل نشده است. این صفحه وضعیت را به‌صورت خودکار دوباره بررسی می‌کند.",
    icon: Clock3,
    iconClass: "bg-amber-500/15 text-amber-500",
    title: "در حال بررسی پرداخت",
  };
  return {
    description: "پرداخت تأیید نشد. اگر مبلغی از حساب شما کسر شده است، کد پرداخت را نگه دارید و با پشتیبانی تماس بگیرید.",
    icon: Clock3,
    iconClass: "bg-destructive/15 text-destructive",
    title: "پرداخت ناموفق",
  };
}
