"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { Coins, Save, SlidersHorizontal } from "lucide-react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  getAdminSilverPrice,
  getAdminSilverSettings,
  updateAdminSilverPrice,
  updateAdminSilverSettings,
} from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { PriceUpdateMeta } from "@/features/silver-platform/price-time";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

export function AdminSilverControlPage({ mode }: { mode: "price" | "settings" }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const price = useQuery({ enabled: mode === "price", queryFn: getAdminSilverPrice, queryKey: ["admin-silver-price"], refetchInterval: 15_000, retry: 1 });
  const settings = useQuery({ enabled: mode === "settings", queryFn: getAdminSilverSettings, queryKey: ["admin-silver-settings"], retry: 1 });
  const access = overview.data?.access;
  const permission = mode === "price" ? "silver.price.manage" : "silver.settings.manage";
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes(permission));
  const mutation = useMutation<unknown, Error, Record<string, number>>({
    mutationFn: (values: Record<string, number>) =>
      mode === "price"
        ? updateAdminSilverPrice({
            buyPricePerGram: values.buyPricePerGram,
            change24h: values.change24h,
            pricePerGram: values.pricePerGram,
            sellPricePerGram: values.sellPricePerGram,
            source: "admin",
          })
        : updateAdminSilverSettings(values),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Save failed")),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-silver-price"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-silver-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] }),
      ]);
      toast.success(t("Changes saved successfully."));
    },
  });

  if (overview.isLoading || price.isLoading || settings.isLoading) {
    return <AdminShell><div className="space-y-4"><ShadowSkeleton className="h-28" /><ShadowSkeleton className="h-[30rem]" /></div></AdminShell>;
  }

  const loadError = overview.error ?? price.error ?? settings.error;
  if (loadError) {
    return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Admin page unavailable")}</AlertTitle><AlertDescription>{loadError.message}</AlertDescription></Alert></AdminShell>;
  }

  const fields = mode === "price" ? priceFields(price.data) : settingsFields(settings.data);
  const Icon = mode === "price" ? Coins : SlidersHorizontal;
  const title = mode === "price" ? "قیمت زنده نقره" : "تنظیمات قیمت و کارمزد";
  const description = mode === "price"
    ? "در زمان اختلال سرویس مرجع، نرخ بازار، خرید و فروش هر گرم را مستقل و دستی ثبت کنید."
    : "بازه دریافت قیمت، اسپرد، کارمزد، حداقل معامله و حداقل وزن تحویل فیزیکی را از یک محل کنترل کنید.";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate(Object.fromEntries(fields.map((field) => [field.name, Number(form.get(field.name))])));
  };

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="space-y-2">
          <Badge variant="outline">مدیریت نقره</Badge>
          <div className="flex items-center gap-3"><Icon className="size-7 text-primary" /><h2 className="text-2xl font-bold md:text-3xl">{title}</h2></div>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p>
        </section>
        {!allowed ? <Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Your current role can view this page, but cannot make changes.")}</AlertDescription></Alert> : null}
        {mode === "price" && price.data ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <Metric label="قیمت پایه هر گرم" value={price.data.pricePerGram} />
              <Metric label="قیمت خرید" value={price.data.buyPricePerGram} />
              <Metric label="قیمت فروش" value={price.data.sellPricePerGram} />
            </section>
            <Card className="rounded-lg border-border bg-card/70">
              <CardContent className="pt-6">
                <PriceUpdateMeta intervalMinutes={price.data.syncIntervalMinutes} updatedAt={price.data.updatedAt} />
              </CardContent>
            </Card>
          </>
        ) : null}
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
              {fields.map((field) => (
                <div className="space-y-2" key={field.name}>
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input defaultValue={field.value} id={field.name} min={field.min} name={field.name} required step={field.step} type="number" />
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                </div>
              ))}
              <div className="md:col-span-2">
                <Button disabled={!allowed || mutation.isPending} type="submit"><Save className="size-4" />{mutation.isPending ? t("Saving...") : t("Save changes")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="rounded-lg bg-card/70"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Number(value).toLocaleString("fa-IR")} تومان</div></CardContent></Card>;
}

interface FieldDefinition { hint: string; label: string; min: number; name: string; step: string; value: string }

function priceFields(data?: Awaited<ReturnType<typeof getAdminSilverPrice>>): FieldDefinition[] {
  return [
    { hint: "قیمت خام بازار برای هر گرم", label: "قیمت نقره (تومان)", min: 1, name: "pricePerGram", step: "1", value: data?.pricePerGram ?? "" },
    { hint: "قیمتی که مشتری برای خرید هر گرم می‌پردازد", label: "قیمت خرید نقره (تومان)", min: 1, name: "buyPricePerGram", step: "1", value: data?.buyPricePerGram ?? "" },
    { hint: "قیمتی که پلتفرم برای خرید از مشتری محاسبه می‌کند", label: "قیمت فروش نقره (تومان)", min: 1, name: "sellPricePerGram", step: "1", value: data?.sellPricePerGram ?? "" },
    { hint: "درصد تغییر نمایشی نسبت به ۲۴ ساعت قبل", label: "تغییر ۲۴ ساعته (درصد)", min: -100, name: "change24h", step: "0.01", value: data?.change24h ?? "0" },
  ];
}

function settingsFields(data?: Awaited<ReturnType<typeof getAdminSilverSettings>>): FieldDefinition[] {
  return [
    { hint: "همین بازه برای دریافت API و شمارش معکوس خرید و فروش استفاده می‌شود", label: "بازه بروزرسانی قیمت (دقیقه)", min: 1, name: "syncIntervalMinutes", step: "1", value: data?.price.syncIntervalMinutes ?? "5" },
    { hint: "درصد کارمزد از مبلغ ناخالص خرید", label: "کارمزد خرید (درصد)", min: 0, name: "buyFeePercent", step: "0.01", value: data?.fees.buyFeePercent ?? "" },
    { hint: "درصد کارمزد از مبلغ ناخالص فروش", label: "کارمزد فروش (درصد)", min: 0, name: "sellFeePercent", step: "0.01", value: data?.fees.sellFeePercent ?? "" },
    { hint: "هزینه ثابت ارسال یا آماده‌سازی تحویل", label: "هزینه تحویل (تومان)", min: 0, name: "deliveryFeeToman", step: "1", value: data?.fees.deliveryFeeToman ?? "" },
    { hint: "فاصله قیمت خرید از نرخ پایه", label: "اسپرد خرید (درصد)", min: 0, name: "spreadBuyPercent", step: "0.01", value: data?.price.spreadBuyPercent ?? "" },
    { hint: "فاصله قیمت فروش از نرخ پایه", label: "اسپرد فروش (درصد)", min: 0, name: "spreadSellPercent", step: "0.01", value: data?.price.spreadSellPercent ?? "" },
    { hint: "کمترین مبلغ مجاز برای ثبت خرید", label: "حداقل خرید (تومان)", min: 50000, name: "minBuyToman", step: "1", value: data?.price.minBuyToman ?? "" },
    { hint: "کمترین وزن مجاز برای فروش", label: "حداقل فروش (گرم)", min: 0.001, name: "minSellGram", step: "0.001", value: data?.price.minSellGram ?? "" },
    { hint: "کمترین دارایی لازم برای درخواست تحویل", label: "حداقل تحویل فیزیکی (گرم)", min: 1, name: "deliveryMinGram", step: "0.001", value: data?.price.deliveryMinGram ?? "" },
    { hint: "زمان تخمینی آماده‌سازی و ارسال برای مشتری", label: "زمان ارسال (روز کاری)", min: 1, name: "deliveryWorkingDays", step: "1", value: data?.price.deliveryWorkingDays ?? "4" },
  ];
}
