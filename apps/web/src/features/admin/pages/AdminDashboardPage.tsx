"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  LifeBuoy,
  MessageSquare,
  ReceiptText,
  Truck,
  UserPlus,
  UserX,
  Users,
  WalletCards,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { getAdminSilverPrice } from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { getSilverPriceHistory } from "@/features/silver-platform/api";
import { PriceUpdateMeta } from "@/features/silver-platform/price-time";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminDashboardPage() {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const livePrice = useQuery({
    queryFn: getAdminSilverPrice,
    queryKey: ["admin-silver-price"],
    refetchInterval: 15_000,
    staleTime: 30_000,
  });
  const priceHistory = useQuery({
    queryFn: () => getSilverPriceHistory(30),
    queryKey: ["silver-price-history", 30],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <AdminDashboardSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>{t("Dashboard unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  const data = overview.data;
  if (!data) {
    return (
      <AdminShell>
        <AdminDashboardSkeleton />
      </AdminShell>
    );
  }

  return (
    <AdminShell access={data.access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-2">
            <Badge className="w-fit" variant="outline">
              {data.access.roleNames.join(" / ")}
            </Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("نمای مدیریت نقره")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("قیمت زنده، سفارش‌های خرید و فروش، کیف پول‌ها، تحویل فیزیکی، احراز هویت، پشتیبانی و سوابق مالی در یک نمای یکپارچه.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => downloadDashboardReport(data)} variant="outline">{t("Export report")}</Button>
            <Button asChild>
              <Link href="/admin/system/operations">{t("بررسی اعلان‌ها")}</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <PriceMetric label={t("قیمت بازار نقره")} value={livePrice.data?.pricePerGram} />
          <PriceMetric label={t("قیمت خرید نقره")} value={livePrice.data?.buyPricePerGram} />
          <PriceMetric label={t("قیمت فروش نقره")} value={livePrice.data?.sellPricePerGram} />
        </section>
        {livePrice.data ? (
          <Card className="rounded-lg border-border bg-card/70">
            <CardContent className="pt-6">
              <PriceUpdateMeta intervalMinutes={livePrice.data.syncIntervalMinutes} updatedAt={livePrice.data.updatedAt} />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("روند قیمت نقره از پایگاه داده")}</CardTitle>
            <Badge variant="outline">{t("۳۰ روز")}</Badge>
          </CardHeader>
          <CardContent className="h-80">
            {priceHistory.data && priceHistory.data.length > 1 ? (
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={priceHistory.data.map((item) => ({
                  buy: Number(item.buyPricePerGram),
                  date: item.createdAt,
                  market: Number(item.pricePerGram),
                  sell: Number(item.sellPricePerGram),
                }))}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["auto", "auto"]} width={64} />
                  <ChartTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Area dataKey="buy" fill="var(--primary)" fillOpacity={0.1} name={t("خرید")} stroke="var(--primary)" strokeWidth={1.5} type="monotone" />
                  <Area dataKey="market" fill="transparent" name={t("بازار")} stroke="var(--foreground)" strokeWidth={1.25} type="monotone" />
                  <Area dataKey="sell" fill="var(--chart-2)" fillOpacity={0.06} name={t("فروش")} stroke="var(--chart-2)" strokeWidth={1.5} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <AdminEmptyState title={t("برای نمایش نمودار حداقل دو قیمت ثبت‌شده لازم است")} />
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.kpis.slice(0, 10).map((kpi) => {
            const Icon = kpiIcon(kpi.label);
            return (
              <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t(kpi.label)}</CardTitle>
                  <span className={cn("grid size-9 place-items-center rounded-lg", toneClass(kpi.tone))}>
                    <Icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(kpi.value)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{t(kpi.meta ?? "Latest recorded value")}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("روند ارزش معاملات")}</CardTitle>
              <Badge variant="outline">{t("۳۰ روز")}</Badge>
            </CardHeader>
            <CardContent className="h-80">
              {data.charts.revenue.length ? (
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={data.charts.revenue}>
                    <defs>
                      <linearGradient id="adminRevenue" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis width={42} />
                    <ChartTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Area dataKey="value" fill="url(#adminRevenue)" stroke="var(--primary)" strokeWidth={1.5} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <AdminEmptyState title={t("هنوز درآمدی ثبت نشده است")} />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("حجم سفارش نقره")}</CardTitle>
              <Badge variant="outline">{t("روزانه")}</Badge>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={data.charts.orders}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis width={32} />
                  <ChartTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("فعالیت‌های اخیر")}</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/system/audit-logs">
                  {t("مشاهده همه")}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("رویداد")}</TableHead>
                      <TableHead>{t("کاربر")}</TableHead>
                      <TableHead>{t("وضعیت")}</TableHead>
                      <TableHead>{t("زمان")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentActivity.map((item) => (
                      <TableRow key={`${item.type}-${item.label}-${item.at}`}>
                        <TableCell className="font-medium">{t(item.label)}</TableCell>
                        <TableCell><AdminUserLink userId={item.userId}>{item.customer}</AdminUserLink></TableCell>
                        <TableCell>
                          <Badge variant="outline">{t(item.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(item.at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <AdminEmptyState title={t("فعالیت جدیدی ثبت نشده است")} />
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader>
                <CardTitle>{t("هشدارهای عملیاتی")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.map((alert) => (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-background/35 p-3" key={alert.label}>
                    <div>
                      <p className="text-sm font-medium">{t(alert.label)}</p>
                      <p className="text-xs text-muted-foreground">{t(alert.severity)}</p>
                    </div>
                    <Badge className={alert.severity === "critical" ? "bg-destructive text-destructive-foreground" : ""} variant="outline">
                      {alert.value}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
              <CardHeader>
                <CardTitle>{t("Service status")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <HealthLine label={t("Request processing")} value={t(data.health.queues)} />
                <HealthLine label={t("Fast data access")} value={t(data.health.redis)} />
                <HealthLine label={t("Search service")} value={t(data.health.search)} />
                <HealthLine label={t("Updated")} value={formatDate(data.health.generatedAt)} />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function kpiIcon(label: string) {
  const icons = {
    "KYC تأییدشده": BadgeCheck,
    "KYC در انتظار": Clock3,
    "KYC شروع‌نشده": UserPlus,
    "KYC ردشده": UserX,
    "درخواست تحویل": Truck,
    "تراکنش کیف پول": WalletCards,
    "تیکت‌ها": LifeBuoy,
    "سفارش‌های نقره": ReceiptText,
    "کاربران ثبت‌نام‌شده": Users,
    "گفتگوی زنده": MessageSquare,
  } as const;
  return icons[label as keyof typeof icons] ?? CircleDollarSign;
}

function PriceMetric({ label, value }: { label: string; value?: string | number }) {
  return (
    <Card className="rounded-lg border-border bg-card/70">
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value == null ? "در حال دریافت…" : `${Number(value).toLocaleString("fa-IR")} تومان`}</div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <ShadowSkeleton className="h-32" key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <ShadowSkeleton className="h-96" />
        <ShadowSkeleton className="h-96" />
      </div>
    </div>
  );
}

function AdminEmptyState({ title }: { title: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
      {title}
    </div>
  );
}

function HealthLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background/35 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function toneClass(tone: string) {
  if (tone === "primary") return "bg-primary/15 text-primary";
  if (tone === "success") return "bg-success/15 text-success";
  if (tone === "warning") return "bg-accent/15 text-accent";
  if (tone === "info") return "bg-secondary text-foreground";
  return "bg-muted text-muted-foreground";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function downloadDashboardReport(data: NonNullable<Awaited<ReturnType<typeof getAdminOverview>>>) {
  if (typeof window === "undefined") return;
  const payload = {
    alerts: data.alerts,
    generatedAt: new Date().toISOString(),
    health: data.health,
    kpis: data.kpis,
    recentActivity: data.recentActivity,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "admin-overview-report.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
