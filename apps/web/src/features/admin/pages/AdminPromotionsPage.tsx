"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  Edit3,
  Gift,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  createAdminPromotion,
  deleteAdminPromotion,
  getAdminPromotionAnalytics,
  getAdminPromotionBloggers,
  getAdminPromotionCalendar,
  getAdminPromotions,
  updateAdminPromotion,
  type AdminPromotion,
  type PromotionBlogger,
  type PromotionInput,
  type PromotionRewardType,
  type PromotionStatus,
} from "@/features/admin/api/admin-promotions-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatTomanMoney, isTomanCurrency, tomanAmount } from "@/shared/lib/toman-money";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Switch } from "@/shared/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

type PromotionMode = "analytics" | "calendar" | "codes";
type PromotionForm = {
  bloggerAffiliateId: string;
  code: string;
  currency: string;
  description: string;
  endsAt: string;
  eventColor: string;
  eventEndsAt: string;
  eventStartsAt: string;
  eventTitle: string;
  hasEvent: boolean;
  maxDiscountAmount: string;
  minOrderAmount: string;
  name: string;
  perUserLimit: string;
  rewardType: PromotionRewardType;
  startsAt: string;
  status: Exclude<PromotionStatus, "EXPIRED">;
  totalUsageLimit: string;
  value: string;
};

const emptyForm: PromotionForm = {
  bloggerAffiliateId: "none",
  code: "",
  currency: "TOMAN",
  description: "",
  endsAt: "",
  eventColor: "#d4af37",
  eventEndsAt: "",
  eventStartsAt: "",
  eventTitle: "",
  hasEvent: false,
  maxDiscountAmount: "",
  minOrderAmount: "0",
  name: "",
  perUserLimit: "1",
  rewardType: "ORDER_PERCENT",
  startsAt: "",
  status: "DRAFT",
  totalUsageLimit: "",
  value: "",
};

const rewardTypes: PromotionRewardType[] = ["ORDER_PERCENT", "ORDER_FIXED", "SILVER_WALLET", "TOMAN_WALLET"];

export function AdminPromotionsPage({ mode }: { mode: PromotionMode }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | PromotionStatus>("all");
  const [rewardType, setRewardType] = useState<"all" | PromotionRewardType>("all");
  const [blogger, setBlogger] = useState("all");
  const [editor, setEditor] = useState<AdminPromotion | "new" | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const viewPermission: Record<PromotionMode, string> = {
    analytics: "promotions.analytics.view",
    calendar: "promotions.calendar.view",
    codes: "promotions.codes.view",
  };
  const allowed = hasAdminPermission(access, viewPermission[mode]);
  const canManageCodes = hasAdminPermission(access, "promotions.codes.manage");
  const canViewAnalytics = hasAdminPermission(access, "promotions.analytics.view");
  const promotions = useQuery({
    enabled: allowed && mode === "codes",
    queryFn: () => getAdminPromotions({
      bloggerAffiliateId: blogger === "all" ? undefined : blogger,
      page,
      pageSize: 15,
      rewardType: rewardType === "all" ? undefined : rewardType,
      search,
      sortOrder: "desc",
      status: status === "all" ? undefined : status,
    }),
    queryKey: ["admin-promotions", page, search, status, rewardType, blogger],
    retry: 1,
  });
  const analytics = useQuery({
    enabled: canViewAnalytics,
    queryFn: getAdminPromotionAnalytics,
    queryKey: ["admin-promotions-analytics"],
    retry: 1,
  });
  const calendar = useQuery({
    enabled: allowed && mode === "calendar",
    queryFn: () => getAdminPromotionCalendar(),
    queryKey: ["admin-promotions-calendar"],
    retry: 1,
  });
  const bloggers = useQuery({
    enabled: canManageCodes || canViewAnalytics,
    queryFn: getAdminPromotionBloggers,
    queryKey: ["admin-promotion-bloggers"],
    retry: 1,
  });
  const save = useMutation({
    mutationFn: () => editor === "new"
      ? createAdminPromotion(toPromotionInput(form))
      : updateAdminPromotion(editor!.id, toPromotionInput(form)),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ذخیره کد تخفیف انجام نشد."),
    onSuccess: async () => {
      setEditor(null);
      setForm(emptyForm);
      await invalidatePromotions(queryClient);
      toast.success("کد تخفیف ذخیره شد.");
    },
  });
  const remove = useMutation({
    mutationFn: deleteAdminPromotion,
    onError: (error) => toast.error(error instanceof Error ? error.message : "حذف کد انجام نشد."),
    onSuccess: async () => {
      await invalidatePromotions(queryClient);
      toast.success("کد تخفیف بایگانی شد.");
    },
  });

  const openEditor = (promotion: AdminPromotion | "new") => {
    setEditor(promotion);
    setForm(promotion === "new" ? emptyForm : promotionToForm(promotion));
  };

  if (overview.isLoading) return <AdminShell><PromotionsSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>پنل تبلیغات در دسترس نیست</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>مجوز لازم است</AlertTitle><AlertDescription>برای مدیریت کدهای تبلیغاتی به مجوز promotions.manage نیاز دارید.</AlertDescription></Alert></AdminShell>;

  const activeError = promotions.error ?? analytics.error ?? calendar.error ?? bloggers.error;
  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">بازاریابی و فروش</Badge>
            <div className="flex items-center gap-3"><Gift className="size-8 text-primary" /><h1 className="text-2xl font-black md:text-3xl">کدهای تبلیغاتی و پاداش</h1></div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">تخفیف درصدی یا مبلغ ثابت، پاداش کیف پول تومان و نقره‌ای، کمپین‌های تقویمی و عملکرد بلاگرها را از یک بخش مدیریت کنید.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={mode === "codes" ? promotions.isLoading || !(promotions.data?.meta.total) : mode === "calendar" ? calendar.isLoading || !(calendar.data?.length) : analytics.isLoading || !(analytics.data?.bloggerReports.length)}
              fetchRows={async () => {
                if (mode === "calendar") return getAdminPromotionCalendar();
                if (mode === "analytics") return (await getAdminPromotionAnalytics()).bloggerReports;
                return fetchAllAdminExportRows(async (exportPage, pageSize) => {
                  const result = await getAdminPromotions({ bloggerAffiliateId: blogger === "all" ? undefined : blogger, page: exportPage, pageSize, rewardType: rewardType === "all" ? undefined : rewardType, search, sortOrder: "desc", status: status === "all" ? undefined : status });
                  return { items: result.data, totalPages: result.meta.totalPages };
                });
              }}
              filename={`promotions-${mode}`}
              sheetName="کدهای تبلیغاتی و پاداش"
            />
            {canManageCodes ? <Button onClick={() => openEditor("new")}><Plus className="size-4" />ساخت کد جدید</Button> : null}
          </div>
        </section>

        <ModeTabs access={access} mode={mode} />
        {activeError ? <Alert variant="destructive"><AlertTitle>داده‌ها کامل بارگذاری نشد</AlertTitle><AlertDescription>{activeError.message}</AlertDescription></Alert> : null}
        {canViewAnalytics ? <Kpis analytics={analytics.data?.kpis} loading={analytics.isLoading} /> : null}

        {mode === "codes" ? (
          <CodesView
            canManage={canManageCodes}
            blogger={blogger}
            bloggers={bloggers.data ?? []}
            loading={promotions.isLoading}
            page={page}
            pageCount={promotions.data?.meta.totalPages ?? 1}
            promotions={promotions.data?.data ?? []}
            rewardType={rewardType}
            search={search}
            status={status}
            deleting={remove.isPending}
            onBlogger={(value) => { setPage(1); setBlogger(value); }}
            onDelete={(promotion) => {
              if (window.confirm(`کد ${promotion.code} بایگانی شود؟`)) remove.mutate(promotion.id);
            }}
            onEdit={openEditor}
            onPage={setPage}
            onRewardType={(value) => { setPage(1); setRewardType(value); }}
            onSearch={(value) => { setPage(1); setSearch(value); }}
            onStatus={(value) => { setPage(1); setStatus(value); }}
          />
        ) : mode === "calendar" ? (
          <CalendarView events={calendar.data ?? []} loading={calendar.isLoading} />
        ) : (
          <AnalyticsView data={analytics.data} loading={analytics.isLoading} />
        )}
      </div>

      {canManageCodes ? <PromotionEditor
        bloggers={bloggers.data ?? []}
        editor={editor}
        form={form}
        saving={save.isPending}
        onChange={setForm}
        onClose={() => setEditor(null)}
        onSave={() => save.mutate()}
      /> : null}
    </AdminShell>
  );
}

function ModeTabs({ access, mode }: { access?: { isSuperAdmin: boolean; permissions: string[] }; mode: PromotionMode }) {
  const links: Array<{ href: string; icon: typeof Tag; label: string; mode: PromotionMode }> = [
    { href: "/admin/marketing/promotions", icon: Tag, label: "کدها", mode: "codes" },
    { href: "/admin/marketing/promotions/calendar", icon: CalendarDays, label: "تقویم کمپین", mode: "calendar" },
    { href: "/admin/marketing/promotions/analytics", icon: BarChart3, label: "گزارش و تحلیل", mode: "analytics" },
  ];
  const permissionByMode: Record<PromotionMode, string> = { analytics: "promotions.analytics.view", calendar: "promotions.calendar.view", codes: "promotions.codes.view" };
  return <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card/60 p-2">{links.filter((item) => hasAdminPermission(access, permissionByMode[item.mode])).map((item) => { const Icon = item.icon; return <Button asChild key={item.mode} variant={mode === item.mode ? "default" : "ghost"}><Link href={item.href as never}><Icon className="size-4" />{item.label}</Link></Button>; })}</div>;
}

function Kpis({ analytics, loading }: { analytics?: Awaited<ReturnType<typeof getAdminPromotionAnalytics>>["kpis"]; loading: boolean }) {
  if (loading) return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div>;
  const items = [
    { icon: Tag, label: "کدهای فعال", value: `${analytics?.activeCodes ?? 0} از ${analytics?.codes ?? 0}` },
    { icon: Users, label: "استفاده موفق", value: String(analytics?.completedRedemptions ?? 0) },
    { icon: WalletCards, label: "پاداش نقره", value: `${formatNumber(analytics?.silverWalletCredit)} گرم` },
    { icon: Gift, label: "جمع تخفیف", value: formatNumber(analytics?.discountAmount) },
  ];
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{items.map(({ icon: Icon, label, value }) => <Card className="bg-card/70" key={label}><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div></CardContent></Card>)}</div>;
}

function CodesView(props: {
  blogger: string;
  bloggers: PromotionBlogger[];
  canManage: boolean;
  deleting: boolean;
  loading: boolean;
  onBlogger: (value: string) => void;
  onDelete: (promotion: AdminPromotion) => void;
  onEdit: (promotion: AdminPromotion) => void;
  onPage: (page: number) => void;
  onRewardType: (value: "all" | PromotionRewardType) => void;
  onSearch: (value: string) => void;
  onStatus: (value: "all" | PromotionStatus) => void;
  page: number;
  pageCount: number;
  promotions: AdminPromotion[];
  rewardType: "all" | PromotionRewardType;
  search: string;
  status: "all" | PromotionStatus;
}) {
  return (
    <Card className="bg-card/70">
      <CardHeader className="space-y-4">
        <CardTitle>فهرست کدهای تبلیغاتی</CardTitle>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_210px_210px]">
          <div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pr-9" onChange={(event) => props.onSearch(event.target.value)} placeholder="جست‌وجوی نام یا کد" value={props.search} /></div>
          <Select onValueChange={props.onStatus} value={props.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه وضعیت‌ها</SelectItem><SelectItem value="ACTIVE">فعال</SelectItem><SelectItem value="DRAFT">پیش‌نویس</SelectItem><SelectItem value="PAUSED">متوقف</SelectItem><SelectItem value="EXPIRED">منقضی</SelectItem></SelectContent></Select>
          <Select onValueChange={props.onRewardType} value={props.rewardType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه پاداش‌ها</SelectItem>{rewardTypes.map((type) => <SelectItem key={type} value={type}>{rewardLabel(type)}</SelectItem>)}</SelectContent></Select>
          <Select onValueChange={props.onBlogger} value={props.blogger}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه بلاگرها</SelectItem>{props.bloggers.map((item) => <SelectItem key={item.id} value={item.id}>{bloggerName(item)}</SelectItem>)}</SelectContent></Select>
        </div>
      </CardHeader>
      <CardContent>
        {props.loading ? <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-14" key={index} />)}</div> : props.promotions.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>کد و کمپین</TableHead><TableHead>نوع پاداش</TableHead><TableHead>مقدار</TableHead><TableHead>مصرف</TableHead><TableHead>بلاگر</TableHead><TableHead>بازه اجرا</TableHead><TableHead>وضعیت</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader>
            <TableBody>{props.promotions.map((promotion) => (
              <TableRow key={promotion.id}>
                <TableCell><p className="font-mono font-black text-primary">{promotion.code}</p><p className="mt-1 text-xs text-muted-foreground">{promotion.name}</p></TableCell>
                <TableCell>{rewardLabel(promotion.rewardType)}</TableCell>
                <TableCell className="font-semibold">{rewardValue(promotion)}</TableCell>
                <TableCell>{promotion.redemptionCount}{promotion.totalUsageLimit ? ` / ${promotion.totalUsageLimit}` : " / ∞"}<p className="text-xs text-muted-foreground">هر کاربر {promotion.perUserLimit}</p></TableCell>
                <TableCell>{promotion.bloggerAffiliate ? bloggerName(promotion.bloggerAffiliate) : "—"}</TableCell>
                <TableCell className="text-xs"><p>{promotion.startsAt ? formatPlatformDate(promotion.startsAt, { dateStyle: "medium" }) : "بدون شروع"}</p><p className="text-muted-foreground">{promotion.endsAt ? formatPlatformDate(promotion.endsAt, { dateStyle: "medium" }) : "بدون پایان"}</p></TableCell>
                <TableCell><StatusBadge status={promotion.effectiveStatus} /></TableCell>
                <TableCell>{props.canManage ? <div className="flex gap-1"><Button aria-label="ویرایش" onClick={() => props.onEdit(promotion)} size="icon" variant="ghost"><Edit3 className="size-4" /></Button><Button aria-label="بایگانی" disabled={props.deleting} onClick={() => props.onDelete(promotion)} size="icon" variant="ghost"><Trash2 className="size-4 text-destructive" /></Button></div> : "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        ) : <div className="grid min-h-52 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">کدی با این فیلترها پیدا نشد.</div>}
        <div className="mt-4 flex items-center justify-between"><Button disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)} variant="outline">قبلی</Button><span className="text-xs text-muted-foreground">صفحه {props.page} از {props.pageCount}</span><Button disabled={props.page >= props.pageCount} onClick={() => props.onPage(props.page + 1)} variant="outline">بعدی</Button></div>
      </CardContent>
    </Card>
  );
}

function CalendarView({ events, loading }: { events: Awaited<ReturnType<typeof getAdminPromotionCalendar>>; loading: boolean }) {
  const groups = useMemo(() => events.reduce<Record<string, typeof events>>((result, event) => {
    const key = event.startsAt.slice(0, 7);
    (result[key] ??= []).push(event);
    return result;
  }, {}), [events]);
  if (loading) return <PromotionsSkeleton />;
  return <div className="space-y-5">{Object.entries(groups).length ? Object.entries(groups).map(([month, monthEvents]) => <Card className="bg-card/70" key={month}><CardHeader><CardTitle>{new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" }).format(new Date(`${month}-15T12:00:00Z`))}</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{monthEvents.map((event) => <div className="relative overflow-hidden rounded-xl border border-border bg-background/35 p-4" key={event.id}><span className="absolute inset-y-0 right-0 w-1" style={{ background: event.color ?? "#d4af37" }} /><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{event.title}</p><p className="mt-1 font-mono text-xs text-primary">{event.promotion.code}</p></div><StatusBadge status={event.promotion.status} /></div><p className="mt-4 text-xs leading-6 text-muted-foreground">{formatPlatformDate(event.startsAt, { dateStyle: "medium", timeStyle: "short" })}<br />تا {formatPlatformDate(event.endsAt, { dateStyle: "medium", timeStyle: "short" })}</p><p className="mt-2 text-xs">{rewardLabel(event.promotion.rewardType)} · {event.promotion.value}</p></div>)}</CardContent></Card>) : <div className="grid min-h-64 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">هنوز رویدادی برای تقویم کمپین ثبت نشده است.</div>}</div>;
}

function AnalyticsView({ data, loading }: { data?: Awaited<ReturnType<typeof getAdminPromotionAnalytics>>; loading: boolean }) {
  if (loading || !data) return <PromotionsSkeleton />;
  const maxRedemptions = Math.max(1, ...data.timeline.map((item) => item.redemptions));
  return <div className="grid gap-5 xl:grid-cols-2"><Card className="bg-card/70 xl:col-span-2"><CardHeader><CardTitle>روند استفاده در ۳۰ روز اخیر</CardTitle></CardHeader><CardContent><div className="flex h-48 items-end gap-1 overflow-hidden rounded-xl border border-border bg-background/35 p-4">{data.timeline.map((point) => <div className="group relative flex h-full min-w-2 flex-1 items-end" key={point.date} title={`${point.date}: ${point.redemptions}`}><div className="w-full rounded-t bg-primary/75 transition hover:bg-primary" style={{ height: `${Math.max(3, (point.redemptions / maxRedemptions) * 100)}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{data.timeline[0]?.date}</span><span>{data.timeline.at(-1)?.date}</span></div></CardContent></Card><Card className="bg-card/70"><CardHeader><CardTitle>کدهای برتر</CardTitle></CardHeader><CardContent>{data.topCodes.length ? <Table><TableHeader><TableRow><TableHead>کد</TableHead><TableHead>استفاده</TableHead><TableHead>فروش منتسب</TableHead></TableRow></TableHeader><TableBody>{data.topCodes.map((row) => <TableRow key={row.id}><TableCell><p className="font-mono font-bold text-primary">{row.code}</p><p className="text-xs text-muted-foreground">{row.name}</p></TableCell><TableCell>{row.redemptions}</TableCell><TableCell>{formatNumber(row.revenue)}</TableCell></TableRow>)}</TableBody></Table> : <EmptyAnalytics />}</CardContent></Card><Card className="bg-card/70"><CardHeader><CardTitle>گزارش بلاگرها</CardTitle></CardHeader><CardContent>{data.bloggerReports.length ? <Table><TableHeader><TableRow><TableHead>بلاگر</TableHead><TableHead>کلیک</TableHead><TableHead>استفاده</TableHead><TableHead>نرخ تبدیل</TableHead><TableHead>فروش</TableHead></TableRow></TableHeader><TableBody>{data.bloggerReports.map((row) => <TableRow key={row.affiliateId}><TableCell><p><AdminUserLink userId={row.userId}>{row.name}</AdminUserLink></p><p className="text-xs text-muted-foreground">{row.contact} · {row.codeCount} کد</p></TableCell><TableCell>{row.clicks}</TableCell><TableCell>{row.redemptions}</TableCell><TableCell>{row.conversionRate.toLocaleString("fa-IR")}٪</TableCell><TableCell>{formatNumber(row.revenue)}</TableCell></TableRow>)}</TableBody></Table> : <EmptyAnalytics />}</CardContent></Card></div>;
}

function PromotionEditor(props: { bloggers: PromotionBlogger[]; editor: AdminPromotion | "new" | null; form: PromotionForm; onChange: (form: PromotionForm) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  const set = <K extends keyof PromotionForm>(key: K, value: PromotionForm[K]) => props.onChange({ ...props.form, [key]: value });
  const fixedDiscount = props.form.rewardType === "ORDER_FIXED";
  const percentDiscount = props.form.rewardType === "ORDER_PERCENT";
  return <Dialog onOpenChange={(open) => !open && props.onClose()} open={props.editor !== null}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{props.editor === "new" ? "ساخت کد تخفیف" : "ویرایش کد تخفیف"}</DialogTitle><DialogDescription>نوع پاداش، محدودیت مصرف، زمان‌بندی و بلاگر منتسب را مشخص کنید.</DialogDescription></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="نام کمپین"><Input onChange={(event) => set("name", event.target.value)} value={props.form.name} /></Field><Field label="کد"><Input className="font-mono uppercase" disabled={props.editor !== "new"} maxLength={40} onChange={(event) => set("code", event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} value={props.form.code} /></Field><Field label="نوع پاداش"><Select onValueChange={(value: PromotionRewardType) => set("rewardType", value)} value={props.form.rewardType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{rewardTypes.map((type) => <SelectItem key={type} value={type}>{rewardLabel(type)}</SelectItem>)}</SelectContent></Select></Field><Field label={percentDiscount ? "درصد تخفیف" : props.form.rewardType === "SILVER_WALLET" ? "مقدار نقره (گرم)" : "مقدار پاداش"}><Input max={percentDiscount ? 100 : undefined} min="0.001" onChange={(event) => set("value", event.target.value)} step="0.001" type="number" value={props.form.value} /></Field>{fixedDiscount ? <Field label="ارز تخفیف ثابت"><Select onValueChange={(value) => set("currency", value)} value={props.form.currency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOMAN">تومان</SelectItem></SelectContent></Select></Field> : null}{percentDiscount ? <Field label="سقف مبلغ تخفیف (اختیاری)"><Input min="0" onChange={(event) => set("maxDiscountAmount", event.target.value)} type="number" value={props.form.maxDiscountAmount} /></Field> : null}<Field label="حداقل مبلغ سفارش"><Input min="0" onChange={(event) => set("minOrderAmount", event.target.value)} type="number" value={props.form.minOrderAmount} /></Field><Field label="سقف مصرف کل"><Input min="1" onChange={(event) => set("totalUsageLimit", event.target.value)} placeholder="خالی = نامحدود" type="number" value={props.form.totalUsageLimit} /></Field><Field label="سقف مصرف هر کاربر"><Input min="1" onChange={(event) => set("perUserLimit", event.target.value)} type="number" value={props.form.perUserLimit} /></Field><Field label="وضعیت"><Select onValueChange={(value: PromotionForm["status"]) => set("status", value)} value={props.form.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">پیش‌نویس</SelectItem><SelectItem value="ACTIVE">فعال</SelectItem><SelectItem value="PAUSED">متوقف</SelectItem></SelectContent></Select></Field><Field label="شروع اعتبار"><Input onChange={(event) => set("startsAt", event.target.value)} type="datetime-local" value={props.form.startsAt} /></Field><Field label="پایان اعتبار"><Input onChange={(event) => set("endsAt", event.target.value)} type="datetime-local" value={props.form.endsAt} /></Field><Field label="بلاگر / معرف"><Select onValueChange={(value) => set("bloggerAffiliateId", value)} value={props.form.bloggerAffiliateId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">بدون بلاگر</SelectItem>{props.bloggers.map((item) => <SelectItem key={item.id} value={item.id}>{bloggerName(item)}</SelectItem>)}</SelectContent></Select></Field><div className="space-y-2 md:col-span-2"><Label>توضیحات داخلی کمپین</Label><Textarea onChange={(event) => set("description", event.target.value)} value={props.form.description} /></div><div className="flex items-center justify-between rounded-xl border border-border bg-background/35 p-4 md:col-span-2"><div><p className="font-semibold">ثبت در تقویم کمپین</p><p className="mt-1 text-xs text-muted-foreground">این رویداد در نمای تقویم بازاریابی نمایش داده می‌شود.</p></div><Switch checked={props.form.hasEvent} onCheckedChange={(checked) => set("hasEvent", checked)} /></div>{props.form.hasEvent ? <><Field label="عنوان رویداد"><Input onChange={(event) => set("eventTitle", event.target.value)} value={props.form.eventTitle} /></Field><Field label="رنگ رویداد"><Input onChange={(event) => set("eventColor", event.target.value)} type="color" value={props.form.eventColor} /></Field><Field label="شروع رویداد"><Input onChange={(event) => set("eventStartsAt", event.target.value)} type="datetime-local" value={props.form.eventStartsAt} /></Field><Field label="پایان رویداد"><Input onChange={(event) => set("eventEndsAt", event.target.value)} type="datetime-local" value={props.form.eventEndsAt} /></Field></> : null}</div><DialogFooter><Button onClick={props.onClose} variant="outline">انصراف</Button><Button disabled={props.saving || !formIsValid(props.form)} onClick={props.onSave}>{props.saving ? <Loader2 className="size-4 animate-spin" /> : null}ذخیره کد</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function EmptyAnalytics() { return <div className="grid min-h-40 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">هنوز داده‌ای برای گزارش وجود ندارد.</div>; }
function PromotionsSkeleton() { return <div className="space-y-4"><ShadowSkeleton className="h-24" /><ShadowSkeleton className="h-96" /></div>; }
function StatusBadge({ status }: { status: PromotionStatus }) { const label = { ACTIVE: "فعال", DRAFT: "پیش‌نویس", EXPIRED: "منقضی", PAUSED: "متوقف" }[status]; return <Badge className={cn(status === "ACTIVE" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-600", status === "EXPIRED" && "border-amber-500/40 bg-amber-500/10 text-amber-600")} variant="outline">{label}</Badge>; }
function rewardLabel(type: PromotionRewardType) { return { ORDER_FIXED: "تخفیف مبلغ ثابت", ORDER_PERCENT: "تخفیف درصدی", SILVER_WALLET: "پاداش کیف پول نقره", TOMAN_WALLET: "پاداش کیف پول تومان" }[type]; }
function rewardValue(promotion: Pick<AdminPromotion, "currency" | "rewardType" | "value">) { if (promotion.rewardType === "ORDER_PERCENT") return `${Number(promotion.value).toLocaleString("fa-IR")}٪`; if (promotion.rewardType === "SILVER_WALLET") return `${Number(promotion.value).toLocaleString("fa-IR")} گرم`; if (promotion.rewardType === "TOMAN_WALLET" || isTomanCurrency(promotion.currency)) return formatTomanMoney(promotion.value, promotion.currency ?? "TOMAN"); return `${Number(promotion.value).toLocaleString("fa-IR")} ${promotion.currency ?? ""}`; }
function bloggerName(blogger: PromotionBlogger) { const name = [blogger.user.profile?.firstName, blogger.user.profile?.lastName].filter(Boolean).join(" "); return name || blogger.user.mobile || blogger.user.email || blogger.code; }
function formatNumber(value?: string | number | null) { return Number(value ?? 0).toLocaleString("fa-IR", { maximumFractionDigits: 3 }); }
function dateTimeLocal(value?: string | null) { if (!value) return ""; const date = new Date(value); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 16); }
function toIso(value: string) { return value ? new Date(value).toISOString() : undefined; }
function optionalNumber(value: string) { return value.trim() ? Number(value) : undefined; }
function formIsValid(form: PromotionForm) { return !!form.name.trim() && /^[A-Z0-9_-]{3,40}$/.test(form.code) && Number(form.value) > 0 && (!form.hasEvent || (!!form.eventTitle.trim() && !!form.eventStartsAt && !!form.eventEndsAt)); }
function promotionToForm(promotion: AdminPromotion): PromotionForm { const event = promotion.events[0]; const currency = promotion.currency ?? "TOMAN"; return { bloggerAffiliateId: promotion.bloggerAffiliateId ?? "none", code: promotion.code, currency: isTomanCurrency(currency) ? "TOMAN" : currency, description: promotion.description ?? "", endsAt: dateTimeLocal(promotion.endsAt), eventColor: event?.color ?? "#d4af37", eventEndsAt: dateTimeLocal(event?.endsAt), eventStartsAt: dateTimeLocal(event?.startsAt), eventTitle: event?.title ?? "", hasEvent: !!event, maxDiscountAmount: promotion.maxDiscountAmount ?? "", minOrderAmount: promotion.minOrderAmount, name: promotion.name, perUserLimit: String(promotion.perUserLimit), rewardType: promotion.rewardType, startsAt: dateTimeLocal(promotion.startsAt), status: promotion.status === "EXPIRED" ? "PAUSED" : promotion.status, totalUsageLimit: promotion.totalUsageLimit ? String(promotion.totalUsageLimit) : "", value: promotion.rewardType === "ORDER_FIXED" ? String(tomanAmount(promotion.value, currency)) : promotion.value }; }
function toPromotionInput(form: PromotionForm): PromotionInput { return { bloggerAffiliateId: form.bloggerAffiliateId === "none" ? null : form.bloggerAffiliateId, code: form.code.trim(), currency: form.rewardType === "ORDER_FIXED" ? form.currency : null, description: form.description.trim() || null, endsAt: toIso(form.endsAt) ?? null, event: form.hasEvent ? { color: form.eventColor, endsAt: toIso(form.eventEndsAt)!, startsAt: toIso(form.eventStartsAt)!, title: form.eventTitle.trim() } : null, maxDiscountAmount: form.rewardType === "ORDER_PERCENT" ? optionalNumber(form.maxDiscountAmount) ?? null : null, minOrderAmount: optionalNumber(form.minOrderAmount), name: form.name.trim(), perUserLimit: optionalNumber(form.perUserLimit), rewardType: form.rewardType, startsAt: toIso(form.startsAt) ?? null, status: form.status, totalUsageLimit: optionalNumber(form.totalUsageLimit) ?? null, value: Number(form.value) }; }
async function invalidatePromotions(queryClient: ReturnType<typeof useQueryClient>) { await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }), queryClient.invalidateQueries({ queryKey: ["admin-promotions-analytics"] }), queryClient.invalidateQueries({ queryKey: ["admin-promotions-calendar"] })]); }
