"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, Loader2, Plus, Search, ShieldCheck, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  createAdminReferralRule,
  getAdminReferralList,
  getAdminReferralReports,
  getAdminReferralRules,
  reconcileAdminReferralKycRewards,
  updateAdminAffiliateStatus,
  updateAdminCommissionStatus,
  updateAdminPayoutStatus,
  updateAdminReferralRule,
  type AdminReferralMode,
  type AdminReferralRule,
  type AdminReferralRuleInput,
} from "@/features/admin/api/admin-referrals-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatTomanMoney, isTomanCurrency } from "@/shared/lib/toman-money";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export type AdminReferralsPageMode = "affiliates" | "clicks" | "commissions" | "conversions" | "fraud" | "kyc-rewards" | "payouts" | "reports" | "rules";

const modeNavigation: Array<{ href: string; label: string; mode: AdminReferralsPageMode }> = [
  { href: "/admin/customers/referrals", label: "معرف‌ها", mode: "affiliates" },
  { href: "/admin/customers/referrals/rules", label: "قوانین پویا", mode: "rules" },
  { href: "/admin/customers/referrals/kyc-rewards", label: "پاداش ثبت‌نام", mode: "kyc-rewards" },
  { href: "/admin/customers/referrals/conversions", label: "تبدیل‌ها", mode: "conversions" },
  { href: "/admin/customers/referrals/commissions", label: "کمیسیون‌ها", mode: "commissions" },
  { href: "/admin/customers/referrals/payouts", label: "تسویه‌ها", mode: "payouts" },
  { href: "/admin/customers/referrals/clicks", label: "کلیک‌ها", mode: "clicks" },
  { href: "/admin/customers/referrals/fraud", label: "کنترل تقلب", mode: "fraud" },
  { href: "/admin/customers/referrals/reports", label: "گزارش جامع", mode: "reports" },
];

const emptyRuleForm = {
  commissionType: "PERCENTAGE",
  cookieWindowDays: "30",
  currency: "TOMAN",
  holdDays: "7",
  maxCommission: "1000000",
  maxConversionsPerUser: "1",
  minOrderAmount: "500000",
  minPayoutAmount: "100000",
  name: "",
  referredRewardMax: "50000",
  referredRewardType: "FIXED",
  referredRewardValue: "50000",
  sortOrder: "100",
  startsAt: "",
  endsAt: "",
  status: "ACTIVE",
  value: "1",
} as const;

type RuleForm = { [K in keyof typeof emptyRuleForm]: string };

export function AdminReferralsPage({ mode }: { mode: AdminReferralsPageMode }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ruleForm, setRuleForm] = useState<RuleForm>({ ...emptyRuleForm });
  const [editingRuleId, setEditingRuleId] = useState<string>();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const viewPermission: Record<AdminReferralsPageMode, string> = {
    affiliates: "referrals.affiliates.view",
    clicks: "referrals.clicks.view",
    commissions: "referrals.commissions.view",
    conversions: "referrals.conversions.view",
    fraud: "referrals.fraud.view",
    "kyc-rewards": "referrals.kyc_rewards.view",
    payouts: "referrals.payouts.view",
    reports: "referrals.reports.view",
    rules: "referrals.rules.view",
  };
  const allowed = hasAdminPermission(access, viewPermission[mode]);
  const canViewReports = hasAdminPermission(access, "referrals.reports.view");
  const managePermission: Partial<Record<AdminReferralsPageMode, string>> = {
    affiliates: "referrals.affiliates.manage",
    commissions: "referrals.commissions.manage",
    "kyc-rewards": "referrals.kyc_rewards.reconcile",
    payouts: "referrals.payouts.manage",
    rules: "referrals.rules.manage",
  };
  const canManage = Boolean(managePermission[mode] && hasAdminPermission(access, managePermission[mode]!));
  const reports = useQuery({ enabled: canViewReports, queryFn: getAdminReferralReports, queryKey: ["admin-referral-reports"], retry: 1 });
  const rules = useQuery({ enabled: allowed && mode === "rules", queryFn: getAdminReferralRules, queryKey: ["admin-referral-rules"], retry: 1 });
  const listMode = mode === "fraud" ? "fraud-signals" : mode as AdminReferralMode;
  const list = useQuery({
    enabled: allowed && !["reports", "rules"].includes(mode),
    queryFn: () => getAdminReferralList(listMode, {
      page,
      pageSize: 15,
      ...(mode === "fraud" ? { risk: status === "all" ? undefined : status } : { status: status === "all" ? undefined : status }),
      search: search || undefined,
      sortOrder: "desc",
    }),
    queryKey: ["admin-referral-list", mode, page, search, status],
    retry: 1,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, kind, nextStatus }: { id: string; kind: "affiliate" | "commission" | "payout"; nextStatus: string }) => {
      if (kind === "affiliate") return updateAdminAffiliateStatus(id, nextStatus);
      if (kind === "commission") return updateAdminCommissionStatus(id, nextStatus);
      return updateAdminPayoutStatus(id, nextStatus);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "به‌روزرسانی وضعیت انجام نشد."),
    onSuccess: () => {
      toast.success("وضعیت با ثبت سابقه مدیریتی به‌روزرسانی شد.");
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-list"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-reports"] });
    },
  });
  const saveRule = useMutation({
    mutationFn: () => {
      const input = ruleInput(ruleForm);
      return editingRuleId ? updateAdminReferralRule(editingRuleId, input) : createAdminReferralRule(input);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ذخیره قانون پاداش انجام نشد."),
    onSuccess: () => {
      toast.success(editingRuleId ? "قانون پاداش به‌روزرسانی شد." : "قانون پاداش جدید فعال شد.");
      setEditingRuleId(undefined);
      setRuleForm({ ...emptyRuleForm });
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-rules"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-reports"] });
    },
  });
  const reconcileKycRewards = useMutation({
    mutationFn: reconcileAdminReferralKycRewards,
    onError: (error) => toast.error(error instanceof Error ? error.message : "بازبینی پاداش‌های ثبت‌نام انجام نشد."),
    onSuccess: (result) => {
      toast.success(`${result.rewardedRegistrations} ثبت‌نام جامانده پاداش گرفت.`);
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-list"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-reports"] });
    },
  });

  if (overview.isLoading) return <AdminShell><PageSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>پنل معرفی در دسترس نیست</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>مجوز لازم است</AlertTitle><AlertDescription>نقش شما اجازه مشاهده این بخش از باشگاه معرفی را ندارد.</AlertDescription></Alert></AdminShell>;

  return (
    <AdminShell access={overview.data?.access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div><Badge variant="outline">باشگاه معرفی نقره</Badge><h2 className="mt-3 text-3xl font-black">مدیریت حرفه‌ای معرفی و پاداش</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">قوانین پویا، انتساب خرید، هدیه دوطرفه، آزادسازی امن کمیسیون، تسویه و کنترل تقلب از یک دفتر عملیاتی.</p></div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={mode === "rules" ? rules.isLoading || !(rules.data?.length) : mode === "reports" ? reports.isLoading || !reports.data : list.isLoading || !(list.data?.meta.total)}
              fetchRows={async () => {
                if (mode === "rules") return getAdminReferralRules();
                if (mode === "reports") return [await getAdminReferralReports()];
                return fetchAllAdminExportRows(async (exportPage, pageSize) => {
                  const result = await getAdminReferralList(listMode, { page: exportPage, pageSize, ...(mode === "fraud" ? { risk: status === "all" ? undefined : status } : { status: status === "all" ? undefined : status }), search: search || undefined, sortOrder: "desc" });
                  return { items: result.data, totalPages: result.meta.totalPages };
                });
              }}
              filename={`referrals-${mode}`}
              sheetName={modeTitle(mode)}
            />
            {modeNavigation.filter((item) => hasAdminPermission(access, viewPermission[item.mode])).map((item) => <Button asChild key={item.mode} size="sm" variant={item.mode === mode ? "default" : "outline"}><Link href={item.href}>{item.label}</Link></Button>)}
          </div>
        </section>

        {!canManage && managePermission[mode] ? <Alert><AlertTriangle className="size-4" /><AlertTitle>دسترسی فقط برای مشاهده</AlertTitle><AlertDescription>این نقش می‌تواند اطلاعات این بخش را ببیند اما اجازه تغییر آن را ندارد.</AlertDescription></Alert> : null}
        {canViewReports ? <ReferralReportCards report={reports.data} loading={reports.isLoading} /> : null}

        {mode === "rules" ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_430px]">
            <RuleList loading={rules.isLoading} onEdit={(rule) => { setEditingRuleId(rule.id); setRuleForm(formFromRule(rule)); }} rules={rules.data ?? []} />
            <RuleEditor allowed={canManage} editing={Boolean(editingRuleId)} form={ruleForm} onCancel={() => { setEditingRuleId(undefined); setRuleForm({ ...emptyRuleForm }); }} onChange={setRuleForm} onSave={() => saveRule.mutate()} pending={saveRule.isPending} />
          </section>
        ) : null}

        {mode === "reports" ? <ReferralFinancialReport allowed={hasAdminPermission(access, "referrals.kyc_rewards.reconcile")} onReconcile={() => reconcileKycRewards.mutate()} pending={reconcileKycRewards.isPending} report={reports.data} /> : null}

        {!["reports", "rules"].includes(mode) ? (
          <Card className="rounded-2xl border-border bg-card/70">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><CardTitle>{modeTitle(mode)}</CardTitle><Badge variant="outline">{list.data?.meta.total ?? 0} رکورد</Badge></div>
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="جستجو با کد، ایمیل، موبایل یا شماره تسویه" value={search} /></div>
                <Select onValueChange={(value) => { setPage(1); setStatus(value); }} value={status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه وضعیت‌ها</SelectItem>{statusOptions(mode).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              </div>
            </CardHeader>
            <CardContent>
              {list.isLoading ? <ShadowSkeleton className="h-80 rounded-2xl" /> : list.isError ? <Alert variant="destructive"><AlertTitle>دریافت اطلاعات ناموفق بود</AlertTitle><AlertDescription>{list.error.message}</AlertDescription></Alert> : <ReferralOperationalTable allowed={canManage} mode={mode} onStatus={(id, kind, nextStatus) => statusMutation.mutate({ id, kind, nextStatus })} pending={statusMutation.isPending} rows={list.data?.data ?? []} />}
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4"><Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} size="sm" variant="outline">قبلی</Button><Button disabled={page >= (list.data?.meta.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">بعدی</Button></div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminShell>
  );
}

function ReferralReportCards({ loading, report }: { loading: boolean; report?: Awaited<ReturnType<typeof getAdminReferralReports>> }) {
  if (loading) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div>;
  const cards = [
    { label: "معرف فعال", value: report?.activeAffiliates ?? 0, meta: `${report?.referredUsers ?? 0} عضو معرفی‌شده`, icon: Users },
    { label: "ثبت‌نام پاداش‌گرفته", value: report?.registrationRewardedReferrals ?? 0, meta: `${report?.clicks ?? 0} کلیک ثبت‌شده`, icon: Activity },
    { label: "پاداش ثبت‌نام پرداخت‌شده", value: formatToman(report?.registrationRewardsPaid), meta: `${formatToman(report?.registrationRewardAmount)} برای هر طرف`, icon: CheckCircle2 },
    { label: "تسویه در جریان", value: formatToman(report?.pendingPayouts), meta: `پرداخت‌شده: ${formatToman(report?.paidPayouts)}`, icon: WalletCards },
  ];
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(({ icon: Icon, label, meta, value }) => <Card className="rounded-2xl border-border bg-card/70" key={label}><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label}</p><Icon className="size-5 text-primary" /></div><strong className="mt-3 block text-2xl">{value}</strong><p className="mt-2 text-xs text-muted-foreground">{meta}</p></CardContent></Card>)}</section>;
}

function RuleList({ loading, onEdit, rules }: { loading: boolean; onEdit: (rule: AdminReferralRule) => void; rules: AdminReferralRule[] }) {
  const { lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  return <Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>قوانین پاداش و اولویت اجرا</CardTitle></CardHeader><CardContent>{loading ? <ShadowSkeleton className="h-72" /> : rules.length ? <Table><TableHeader><TableRow><TableHead>قانون</TableHead><TableHead>پاداش معرف</TableHead><TableHead>هدیه عضو</TableHead><TableHead>شرایط</TableHead><TableHead>وضعیت</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader><TableBody>{rules.map((rule) => <TableRow key={rule.id}><TableCell><p className="font-bold">{rule.name}</p><p className="text-xs text-muted-foreground">اولویت {rule.sortOrder} · {t(rule.currency)}</p></TableCell><TableCell>{rewardLabel(rule.commissionType, rule.value, rule.currency)}</TableCell><TableCell>{rule.referredRewardType ? rewardLabel(rule.referredRewardType, rule.referredRewardValue, rule.currency) : "—"}</TableCell><TableCell><p>{formatToman(rule.minOrderAmount)} حداقل خرید</p><p className="text-xs text-muted-foreground">{rule.holdDays} روز نگهداری · {rule.maxConversionsPerUser || "∞"} تبدیل</p></TableCell><TableCell><Badge variant={rule.status === "ACTIVE" ? "default" : "outline"}>{t(rule.status)}</Badge></TableCell><TableCell><Button onClick={() => onEdit(rule)} size="sm" variant="outline">ویرایش</Button></TableCell></TableRow>)}</TableBody></Table> : <EmptyState text="هنوز قانون پاداشی تعریف نشده است." />}</CardContent></Card>;
}

function RuleEditor({ allowed, editing, form, onCancel, onChange, onSave, pending }: { allowed: boolean; editing: boolean; form: RuleForm; onCancel: () => void; onChange: (value: RuleForm) => void; onSave: () => void; pending: boolean }) {
  const field = (key: keyof RuleForm, value: string) => onChange({ ...form, [key]: value });
  return <Card className="h-fit rounded-2xl border-primary/25 bg-card/70"><CardHeader><CardTitle>{editing ? "ویرایش قانون پاداش" : "قانون پاداش جدید"}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
    <FormField className="md:col-span-2 xl:col-span-1 2xl:col-span-2" label="نام قانون"><Input onChange={(event) => field("name", event.target.value)} placeholder="مثلاً کمپین مشتری جدید" value={form.name} /></FormField>
    <FormField label="نوع پاداش معرف"><Select onValueChange={(value) => field("commissionType", value)} value={form.commissionType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">درصد از خرید</SelectItem><SelectItem value="FIXED">مبلغ ثابت</SelectItem></SelectContent></Select></FormField>
    <FormField label="مقدار پاداش"><Input min="0" onChange={(event) => field("value", event.target.value)} type="number" value={form.value} /></FormField>
    <FormField label="نوع هدیه عضو"><Select onValueChange={(value) => field("referredRewardType", value)} value={form.referredRewardType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">درصد از خرید</SelectItem><SelectItem value="FIXED">مبلغ ثابت</SelectItem></SelectContent></Select></FormField>
    <FormField label="مقدار هدیه عضو"><Input min="0" onChange={(event) => field("referredRewardValue", event.target.value)} type="number" value={form.referredRewardValue} /></FormField>
    <FormField label="سقف هدیه عضو"><Input min="0" onChange={(event) => field("referredRewardMax", event.target.value)} type="number" value={form.referredRewardMax} /></FormField>
    <FormField label="حداقل خرید"><Input min="0" onChange={(event) => field("minOrderAmount", event.target.value)} type="number" value={form.minOrderAmount} /></FormField>
    <FormField label="سقف کمیسیون"><Input min="0" onChange={(event) => field("maxCommission", event.target.value)} type="number" value={form.maxCommission} /></FormField>
    <FormField label="حداقل تسویه"><Input min="0" onChange={(event) => field("minPayoutAmount", event.target.value)} type="number" value={form.minPayoutAmount} /></FormField>
    <FormField label="مهلت کوکی (روز)"><Input min="1" onChange={(event) => field("cookieWindowDays", event.target.value)} type="number" value={form.cookieWindowDays} /></FormField>
    <FormField label="دوره بررسی (روز)"><Input min="0" onChange={(event) => field("holdDays", event.target.value)} type="number" value={form.holdDays} /></FormField>
    <FormField label="حداکثر تبدیل هر عضو"><Input min="0" onChange={(event) => field("maxConversionsPerUser", event.target.value)} type="number" value={form.maxConversionsPerUser} /></FormField>
    <FormField label="اولویت اجرا"><Input onChange={(event) => field("sortOrder", event.target.value)} type="number" value={form.sortOrder} /></FormField>
    <FormField label="وضعیت"><Select onValueChange={(value) => field("status", value)} value={form.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">فعال</SelectItem><SelectItem value="INACTIVE">غیرفعال</SelectItem></SelectContent></Select></FormField>
    <FormField label="شروع زمان‌بندی"><Input onChange={(event) => field("startsAt", event.target.value)} type="datetime-local" value={form.startsAt} /></FormField>
    <FormField label="پایان زمان‌بندی"><Input onChange={(event) => field("endsAt", event.target.value)} type="datetime-local" value={form.endsAt} /></FormField>
    <div className="flex gap-2 md:col-span-2 xl:col-span-1 2xl:col-span-2"><Button className="flex-1" disabled={!allowed || pending || !form.name.trim() || Number(form.value) < 0} onClick={onSave}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{editing ? "ذخیره تغییرات" : "ایجاد قانون"}</Button>{editing ? <Button onClick={onCancel} variant="outline">انصراف</Button> : null}</div>
  </CardContent></Card>;
}

function ReferralFinancialReport({ allowed, onReconcile, pending, report }: { allowed: boolean; onReconcile: () => void; pending: boolean; report?: Awaited<ReturnType<typeof getAdminReferralReports>> }) {
  const { lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const statuses = Object.entries(report?.commissionByStatus ?? {});
  return <section className="grid gap-5 xl:grid-cols-2"><Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>قیف معرفی و پاداش ثبت‌نام</CardTitle></CardHeader><CardContent className="space-y-3"><ReportLine label="کلیک ثبت‌شده" value={String(report?.clicks ?? 0)} /><ReportLine label="اعضای معرفی‌شده" value={String(report?.referredUsers ?? 0)} /><ReportLine label="ثبت‌نام پاداش‌گرفته" value={String(report?.registrationRewardedReferrals ?? 0)} /><ReportLine label="پاداش هر طرف" value={formatToman(report?.registrationRewardAmount)} /><ReportLine label="کل واریزی دوطرفه" value={formatToman(report?.registrationRewardsPaid)} /></CardContent></Card><Card className="rounded-2xl border-border bg-card/70"><CardHeader><CardTitle>سوابق مالی قدیمی معرفی خرید</CardTitle></CardHeader><CardContent className="space-y-3">{statuses.map(([status, amount]) => <ReportLine key={status} label={`پاداش ${t(status)}`} value={formatToman(amount)} />)}<ReportLine label="هدیه خرید پرداخت‌شده" value={formatToman(report?.referredUserRewards)} /><ReportLine label="تسویه در جریان" value={formatToman(report?.pendingPayouts)} /><ReportLine label="تسویه پرداخت‌شده" value={formatToman(report?.paidPayouts)} /></CardContent></Card><Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 xl:col-span-2"><CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><p className="font-bold">بازبینی پاداش‌های ثبت‌نام</p><p className="mt-1 text-sm text-muted-foreground">کاربران معرفی‌شده‌ای که قبلاً ثبت‌نام کرده‌اند اما پاداش نگرفته‌اند، به‌صورت امن و بدون واریز تکراری بررسی می‌شوند.</p></div><div className="flex items-center gap-2"><Badge variant={report?.fraudSignals ? "destructive" : "secondary"}>{report?.fraudSignals ?? 0} سیگنال ریسک</Badge><Button disabled={!allowed || pending} onClick={onReconcile}>{pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}بازبینی امن</Button></div></CardContent></Card></section>;
}

function ReferralOperationalTable({ allowed, mode, onStatus, pending, rows }: { allowed: boolean; mode: AdminReferralsPageMode; onStatus: (id: string, kind: "affiliate" | "commission" | "payout", status: string) => void; pending: boolean; rows: Record<string, unknown>[] }) {
  const { lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  if (!rows.length) return <EmptyState text="رکوردی با فیلتر انتخاب‌شده وجود ندارد." />;
  return <Table><TableHeader><TableRow><TableHead>شناسه / عنوان</TableHead><TableHead>معرف</TableHead><TableHead>عضو / جزئیات</TableHead><TableHead>مبلغ / عملکرد</TableHead><TableHead>وضعیت</TableHead><TableHead>زمان</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => { const affiliate = record(row.affiliate) ?? (mode === "affiliates" ? row : undefined); const affiliateUser = record(affiliate?.user); const customer = record(row.customer) ?? record(row.referredUser); const counts = record(row._count); const status = text(row.status) ?? text(row.risk) ?? "—"; const id = text(row.id) ?? ""; return <TableRow key={id}><TableCell><p className="font-mono font-bold">{text(row.payoutNumber) ?? text(row.code) ?? text(row.reason) ?? id.slice(-10)}</p><p className="mt-1 text-xs text-muted-foreground">{modeLabel(mode)}{text(row.role) ? ` · ${text(row.role) === "INVITER" ? "سهم معرف" : "سهم عضو"}` : ""}</p></TableCell><TableCell><AdminUserLink userId={text(affiliateUser?.id)}>{personName(affiliateUser) ?? text(affiliate?.code) ?? "—"}</AdminUserLink><p className="mt-1 text-xs text-muted-foreground">{text(affiliateUser?.mobile) ?? text(affiliateUser?.email)}</p></TableCell><TableCell>{customer ? <><AdminUserLink userId={text(customer.id)}>{personName(customer) ?? "کاربر نقره"}</AdminUserLink><p className="text-xs text-muted-foreground">{text(customer.mobile) ?? text(customer.email)}</p></> : mode === "affiliates" ? <span className="text-xs text-muted-foreground">{number(counts?.referredUsers)} عضو · {number(counts?.conversions)} تبدیل</span> : <span className="max-w-xs text-xs text-muted-foreground">{text(row.landingPath) ?? text(row.ipAddress) ?? text(row.reason) ?? "—"}</span>}</TableCell><TableCell>{mode === "affiliates" ? <><p>{formatToman(affiliate?.balance)}</p><p className="text-xs text-muted-foreground">{number(counts?.clicks)} کلیک</p></> : <><p className="font-bold">{formatMoney(row.amount ?? row.commissionAmount, text(row.currency))}</p><p className="text-xs text-muted-foreground">{text(record(row.referredReward)?.amount) ? `هدیه عضو: ${formatMoney(record(row.referredReward)?.amount, text(row.currency))}` : text(row.utm) ?? ""}</p></>}</TableCell><TableCell><Badge variant={status === "HIGH" || ["FAILED", "REJECTED", "SUSPENDED"].includes(status) ? "destructive" : "outline"}>{t(status)}</Badge></TableCell><TableCell>{formatDate(row.createdAt ?? row.requestedAt)}</TableCell><TableCell><RowActions allowed={allowed} id={id} mode={mode} onStatus={onStatus} pending={pending} status={status} /></TableCell></TableRow>; })}</TableBody></Table>;
}

function RowActions({ allowed, id, mode, onStatus, pending, status }: { allowed: boolean; id: string; mode: AdminReferralsPageMode; onStatus: (id: string, kind: "affiliate" | "commission" | "payout", status: string) => void; pending: boolean; status: string }) {
  if (!allowed || pending) return <span className="text-xs text-muted-foreground">{pending ? "در حال ثبت..." : "فقط مشاهده"}</span>;
  if (mode === "affiliates") return <div className="flex gap-1">{status !== "ACTIVE" ? <Button onClick={() => onStatus(id, "affiliate", "ACTIVE")} size="sm">فعال‌سازی</Button> : <Button onClick={() => onStatus(id, "affiliate", "SUSPENDED")} size="sm" variant="outline">تعلیق</Button>}</div>;
  if (mode === "commissions") {
    if (["REJECTED", "CANCELLED", "PAID"].includes(status)) return <span className="text-xs text-muted-foreground">نهایی</span>;
    if (status === "PAYABLE") return <span className="text-xs text-emerald-600">آماده تسویه</span>;
    return <div className="flex gap-1"><Button onClick={() => onStatus(id, "commission", "PAYABLE")} size="sm">آزادسازی</Button><Button onClick={() => onStatus(id, "commission", "REJECTED")} size="sm" variant="outline">رد</Button></div>;
  }
  if (mode === "payouts") {
    if (status === "REQUESTED") return <div className="flex gap-1"><Button onClick={() => onStatus(id, "payout", "APPROVED")} size="sm">تأیید</Button><Button onClick={() => onStatus(id, "payout", "REJECTED")} size="sm" variant="outline">رد</Button></div>;
    if (status === "APPROVED") return <Button onClick={() => onStatus(id, "payout", "PROCESSING")} size="sm">ارسال به بانک</Button>;
    if (status === "PROCESSING" || status === "FAILED") return <div className="flex gap-1"><Button onClick={() => onStatus(id, "payout", status === "FAILED" ? "PROCESSING" : "PAID")} size="sm">{status === "FAILED" ? "تلاش مجدد" : "پرداخت شد"}</Button>{status === "PROCESSING" ? <Button onClick={() => onStatus(id, "payout", "FAILED")} size="sm" variant="outline">ناموفق</Button> : null}</div>;
  }
  return <span className="text-xs text-muted-foreground">ثبت‌شده</span>;
}

function FormField({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) { return <div className={cn("space-y-2", className)}><Label>{label}</Label>{children}</div>; }
function ReportLine({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>; }
function EmptyState({ text: value }: { text: string }) { return <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">{value}</div>; }
function PageSkeleton() { return <div className="space-y-4"><ShadowSkeleton className="h-32" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><ShadowSkeleton className="h-80" /></div>; }

function ruleInput(form: RuleForm): AdminReferralRuleInput { return { commissionType: form.commissionType as "FIXED" | "PERCENTAGE", cookieWindowDays: Number(form.cookieWindowDays), currency: form.currency, endsAt: isoDate(form.endsAt), holdDays: Number(form.holdDays), maxCommission: optionalNumber(form.maxCommission), maxConversionsPerUser: Number(form.maxConversionsPerUser), minOrderAmount: Number(form.minOrderAmount), minPayoutAmount: Number(form.minPayoutAmount), name: form.name.trim(), referredRewardMax: optionalNumber(form.referredRewardMax), referredRewardType: form.referredRewardType as "FIXED" | "PERCENTAGE", referredRewardValue: Number(form.referredRewardValue), sortOrder: Number(form.sortOrder), startsAt: isoDate(form.startsAt), status: form.status as "ACTIVE" | "INACTIVE", value: Number(form.value) }; }
function formFromRule(rule: AdminReferralRule): RuleForm { return { commissionType: rule.commissionType, cookieWindowDays: String(rule.cookieWindowDays), currency: rule.currency, endsAt: localDate(rule.endsAt), holdDays: String(rule.holdDays), maxCommission: rule.maxCommission ?? "", maxConversionsPerUser: String(rule.maxConversionsPerUser), minOrderAmount: rule.minOrderAmount, minPayoutAmount: rule.minPayoutAmount, name: rule.name, referredRewardMax: rule.referredRewardMax ?? "", referredRewardType: rule.referredRewardType ?? "FIXED", referredRewardValue: rule.referredRewardValue, sortOrder: String(rule.sortOrder), startsAt: localDate(rule.startsAt), status: rule.status, value: rule.value }; }
function isoDate(value: string) { return value ? new Date(value).toISOString() : undefined; }
function localDate(value?: string | null) { if (!value) return ""; const date = new Date(value); const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function optionalNumber(value: string) { return value.trim() === "" ? undefined : Number(value); }
function rewardLabel(type: string, value: unknown, currency: string) { return type === "PERCENTAGE" ? `${value}٪` : formatMoney(value, currency); }
function formatMoney(value: unknown, currency?: string) { if (!currency || isTomanCurrency(currency)) return formatTomanMoney(Number(value ?? 0), currency ?? "TOMAN"); const amount = Number(value ?? 0); const label = currency === "USD" ? "دلار" : currency === "SILVER_GRAM" ? "گرم نقره" : currency; return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)} ${label}`; }
function formatToman(value: unknown) { return formatMoney(value, "TOMAN"); }
function formatDate(value: unknown) { const parsed = text(value); return parsed ? formatPlatformDate(parsed, { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function record(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
function text(value: unknown): string | undefined { if (typeof value === "string" || typeof value === "number") return String(value); if (value && typeof value === "object") return JSON.stringify(value); return undefined; }
function number(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0; }
function personName(user?: Record<string, unknown>) { const profile = record(user?.profile); return [text(profile?.firstName), text(profile?.lastName)].filter(Boolean).join(" ") || text(user?.email) || text(user?.mobile); }
function modeLabel(mode: AdminReferralsPageMode) { return ({ affiliates: "حساب معرف", clicks: "کلیک", commissions: "کمیسیون", conversions: "تبدیل خرید", fraud: "سیگنال ریسک", "kyc-rewards": "پاداش ثبت‌نام", payouts: "درخواست تسویه", reports: "گزارش", rules: "قانون" } as Record<string, string>)[mode]; }
function modeTitle(mode: AdminReferralsPageMode) { return ({ affiliates: "حساب‌ها و عملکرد معرف‌ها", clicks: "کلیک‌ها و مسیرهای ورودی", commissions: "دفتر کمیسیون و آزادسازی", conversions: "خریدهای منتسب قدیمی", fraud: "سیگنال‌های تقلب و بررسی ریسک", "kyc-rewards": "دفتر پاداش دوطرفه ثبت‌نام", payouts: "صف تأیید و پرداخت تسویه‌ها" } as Record<string, string>)[mode] ?? "مدیریت معرفی"; }
function statusOptions(mode: AdminReferralsPageMode) { return ({ affiliates: ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"], clicks: ["RECORDED", "CONVERTED", "FLAGGED"], commissions: ["PENDING", "APPROVED", "PAYABLE", "PAID", "REJECTED", "CANCELLED"], fraud: ["LOW", "MEDIUM", "HIGH"], "kyc-rewards": ["PENDING", "CREDITED", "REVOKED", "FAILED"], payouts: ["REQUESTED", "APPROVED", "PROCESSING", "PAID", "REJECTED", "FAILED"] } as Record<string, string[]>)[mode] ?? []; }
