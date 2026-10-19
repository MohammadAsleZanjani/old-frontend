"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Gift, Loader2, PackageCheck, Plus, RotateCw, Save, Search, ShieldCheck, Sparkles, TicketPlus, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  createWheelCampaign,
  getWheelAnalytics,
  getWheelCampaign,
  getWheelCampaigns,
  getWheelClaims,
  getWheelSpins,
  grantWheelSpins,
  updateWheelCampaign,
  updateWheelClaim,
  type AdminWheelCampaign,
  type AdminWheelCampaignStatus,
  type AdminWheelPrizeType,
} from "@/features/admin/api/admin-wheel-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Switch } from "@/shared/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export type AdminWheelMode = "analytics" | "campaigns" | "claims" | "history";

interface PrizeForm {
  dailyLimit: string;
  displayOrder: number;
  id?: string;
  isActive: boolean;
  isJackpot: boolean;
  maxDiscountAmount: string;
  minimumPurchase: string;
  perUserLimit: string;
  probability: string;
  prizeType: AdminWheelPrizeType;
  prizeValue: string;
  rewardExpiryDays: string;
  stockLimit: string;
  titleEn: string;
  titleFa: string;
}

interface CampaignForm {
  dailySpinLimit: string;
  endsAt: string;
  extraSpinCapPerUser: string;
  firstSpinEnabled: boolean;
  globalSpinLimit: string;
  name: string;
  perUserSpinLimit: string;
  prizes: PrizeForm[];
  rateLimitPerMinute: string;
  requiresVerifiedEmail: boolean;
  requiresVerifiedMobile: boolean;
  slug: string;
  startsAt: string;
  status: AdminWheelCampaignStatus;
}

export function AdminWheelPage({ mode }: { mode: AdminWheelMode }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<CampaignForm>(() => emptyCampaignForm());
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [grant, setGrant] = useState({ quantity: "1", userId: "" });
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const viewPermission: Record<AdminWheelMode, string> = {
    analytics: "wheel.analytics.view",
    campaigns: "wheel.campaigns.view",
    claims: "wheel.claims.view",
    history: "wheel.spins.view",
  };
  const allowed = hasAdminPermission(access, viewPermission[mode]);
  const canManageCampaigns = hasAdminPermission(access, "wheel.campaigns.manage");
  const canGrantSpins = hasAdminPermission(access, "wheel.spins.grant");
  const canManageClaims = hasAdminPermission(access, "wheel.claims.manage");
  const campaigns = useQuery({ enabled: allowed, queryFn: () => getWheelCampaigns({ pageSize: 50 }), queryKey: ["admin-wheel-campaigns"], retry: 1 });
  const detail = useQuery({ enabled: allowed && Boolean(selectedId), queryFn: () => getWheelCampaign(selectedId), queryKey: ["admin-wheel-campaign", selectedId], retry: 1 });
  const spins = useQuery({ enabled: allowed && mode === "history" && Boolean(selectedId), queryFn: () => getWheelSpins(selectedId, { pageSize: 50, search }), queryKey: ["admin-wheel-spins", selectedId, search], retry: 1 });
  const claims = useQuery({ enabled: allowed && mode === "claims", queryFn: () => getWheelClaims({ pageSize: 50, search }), queryKey: ["admin-wheel-claims", search], retry: 1 });
  const analytics = useQuery({ enabled: allowed && mode === "analytics" && Boolean(selectedId), queryFn: () => getWheelAnalytics(selectedId), queryKey: ["admin-wheel-analytics", selectedId], retry: 1 });

  useEffect(() => {
    if (!selectedId && campaigns.data?.items[0]?.id) setSelectedId(campaigns.data.items[0].id);
  }, [campaigns.data?.items, selectedId]);
  useEffect(() => {
    if (detail.data && !dirty) setForm(campaignToForm(detail.data));
  }, [detail.data, dirty]);

  const probabilityTotal = useMemo(() => form.prizes.reduce((sum, prize) => sum + Number(prize.probability || 0), 0), [form.prizes]);
  const save = useMutation({
    mutationFn: () => updateWheelCampaign(selectedId, campaignInput(form)),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ذخیره کمپین انجام نشد"),
    onSuccess: async () => {
      setDirty(false);
      await invalidateWheel(queryClient, selectedId);
      toast.success("کمپین و احتمالات با موفقیت ذخیره شد");
    },
  });
  const create = useMutation({
    mutationFn: () => {
      const next = emptyCampaignForm();
      next.name = `کمپین گردونه ${new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date())}`;
      next.slug = `wheel-${Date.now()}`;
      return createWheelCampaign(campaignInput(next));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ساخت کمپین انجام نشد"),
    onSuccess: async (campaign) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-wheel-campaigns"] });
      setSelectedId(campaign.id);
      setDirty(false);
      toast.success("کمپین پیش‌نویس با ۱۰ جایزه ساخته شد");
    },
  });
  const grantSpins = useMutation({
    mutationFn: () => grantWheelSpins(selectedId, { quantity: Number(grant.quantity), source: "ADMIN", userId: grant.userId }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "اعطای شانس انجام نشد"),
    onSuccess: async () => { setGrant({ quantity: "1", userId: "" }); await invalidateWheel(queryClient, selectedId); toast.success("شانس چرخش به کاربر اضافه شد"); },
  });
  const claimStatus = useMutation({
    mutationFn: ({ id, status, trackingCode }: { id: string; status: string; trackingCode?: string }) => updateWheelClaim(id, { status, trackingCode }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "بروزرسانی ادعا انجام نشد"),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-wheel-claims"] }); toast.success("وضعیت تحویل بروزرسانی شد"); },
  });

  if (overview.isLoading) return <AdminShell><ShadowSkeleton className="h-[650px] rounded-2xl" /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>گردونه در دسترس نیست</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>مجوز لازم است</AlertTitle><AlertDescription>برای مدیریت گردونه به مجوز wheel.manage نیاز دارید.</AlertDescription></Alert></AdminShell>;

  const activeError = campaigns.error ?? detail.error ?? spins.error ?? claims.error ?? analytics.error;
  return <AdminShell access={access}>
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><Badge variant="outline">جذب و وفادارسازی</Badge><div className="mt-3 flex items-center gap-3"><Sparkles className="size-8 text-primary" /><h1 className="text-2xl font-black md:text-3xl">گردونه جایزه و Spin-to-Win</h1></div><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">کمپین، ۱۰ جایزه، احتمالات امن، سقف‌ها، موجودی جک‌پات، شانس‌های کاربران، تحویل فیزیکی و قیف تبدیل را یکجا کنترل کنید.</p></div>
        <div className="flex flex-wrap gap-2">
          <AdminExcelExportButton
            disabled={mode === "campaigns" ? campaigns.isLoading || !(campaigns.data?.total) : mode === "history" ? spins.isLoading || !(spins.data?.total) : mode === "claims" ? claims.isLoading || !(claims.data?.total) : analytics.isLoading || !(analytics.data?.prizes.length)}
            fetchRows={async () => {
              if (mode === "campaigns") return fetchAllAdminExportRows((exportPage, pageSize) => getWheelCampaigns({ page: exportPage, pageSize }));
              if (mode === "analytics") return (await getWheelAnalytics(selectedId)).prizes;
              if (mode === "history") return fetchAllAdminExportRows(async (exportPage, pageSize) => {
                const result = await getWheelSpins(selectedId, { page: exportPage, pageSize, search });
                return { items: result.items, totalPages: Math.max(1, Math.ceil(result.total / pageSize)) };
              });
              return fetchAllAdminExportRows(async (exportPage, pageSize) => {
                const result = await getWheelClaims({ page: exportPage, pageSize, search });
                return { items: result.items, totalPages: Math.max(1, Math.ceil(result.total / pageSize)) };
              });
            }}
            filename={`wheel-${mode}`}
            sheetName="گردونه جایزه"
          />
          {canManageCampaigns ? <Button disabled={create.isPending} onClick={() => create.mutate()}>{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}کمپین جدید</Button> : null}
        </div>
      </section>
      <WheelTabs access={access} mode={mode} />
      {activeError ? <Alert variant="destructive"><AlertTitle>بخشی از داده‌ها بارگذاری نشد</AlertTitle><AlertDescription>{activeError.message}</AlertDescription></Alert> : null}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4 md:flex-row md:items-center">
        <label className="text-sm font-semibold">کمپین فعال برای مشاهده</label>
        <Select value={selectedId} onValueChange={(value) => { setSelectedId(value); setDirty(false); }}><SelectTrigger className="md:max-w-sm"><SelectValue placeholder="انتخاب کمپین" /></SelectTrigger><SelectContent>{(campaigns.data?.items ?? []).map((campaign) => <SelectItem key={campaign.id} value={campaign.id}>{campaign.name} · <EnumLabel value={campaign.status} /></SelectItem>)}</SelectContent></Select>
        {detail.data ? <div className="ms-auto flex gap-2"><Badge variant={detail.data.status === "ACTIVE" ? "default" : "secondary"}><EnumLabel value={detail.data.status} /></Badge><Badge variant="outline">{detail.data.completedSpinCount.toLocaleString("fa-IR")} چرخش</Badge></div> : null}
      </div>

      {mode === "campaigns" ? <CampaignEditor canManage={canManageCampaigns} detail={detail.data} form={form} probabilityTotal={probabilityTotal} saving={save.isPending} onChange={(next) => { if (canManageCampaigns) { setDirty(true); setForm(next); } }} onSave={() => save.mutate()} /> : null}
      {mode === "history" ? <HistoryView canGrant={canGrantSpins} grant={grant} loading={spins.isLoading} rows={spins.data?.items ?? []} search={search} submitting={grantSpins.isPending} onGrant={setGrant} onSearch={setSearch} onSubmit={() => grantSpins.mutate()} /> : null}
      {mode === "claims" ? <ClaimsView canManage={canManageClaims} loading={claims.isLoading} rows={claims.data?.items ?? []} search={search} updating={claimStatus.isPending} onSearch={setSearch} onStatus={(id, status, trackingCode) => claimStatus.mutate({ id, status, trackingCode })} /> : null}
      {mode === "analytics" ? <AnalyticsView data={analytics.data} loading={analytics.isLoading} /> : null}
    </div>
  </AdminShell>;
}

function WheelTabs({ access, mode }: { access?: { isSuperAdmin: boolean; permissions: string[] }; mode: AdminWheelMode }) {
  const tabs: Array<{ href: string; icon: typeof Gift; label: string; mode: AdminWheelMode }> = [
    { href: "/admin/marketing/wheel", icon: Gift, label: "کمپین و جوایز", mode: "campaigns" },
    { href: "/admin/marketing/wheel/history", icon: RotateCw, label: "چرخش‌ها و اعطا", mode: "history" },
    { href: "/admin/marketing/wheel/claims", icon: PackageCheck, label: "تحویل جک‌پات", mode: "claims" },
    { href: "/admin/marketing/wheel/analytics", icon: BarChart3, label: "تحلیل قیف", mode: "analytics" },
  ];
  const permissionByMode: Record<AdminWheelMode, string> = { analytics: "wheel.analytics.view", campaigns: "wheel.campaigns.view", claims: "wheel.claims.view", history: "wheel.spins.view" };
  return <div className="flex flex-wrap gap-2">{tabs.filter((tab) => hasAdminPermission(access, permissionByMode[tab.mode])).map((tab) => <Button asChild key={tab.mode} variant={mode === tab.mode ? "default" : "outline"}><Link href={tab.href}><tab.icon className="size-4" />{tab.label}</Link></Button>)}</div>;
}

function CampaignEditor({ canManage, detail, form, probabilityTotal, saving, onChange, onSave }: { canManage: boolean; detail?: AdminWheelCampaign; form: CampaignForm; onChange: (form: CampaignForm) => void; onSave: () => void; probabilityTotal: number; saving: boolean }) {
  if (!detail) return <ShadowSkeleton className="h-[620px] rounded-2xl" />;
  const field = <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => onChange({ ...form, [key]: value });
  const prizeField = <K extends keyof PrizeForm>(index: number, key: K, value: PrizeForm[K]) => onChange({ ...form, prizes: form.prizes.map((prize, row) => row === index ? { ...prize, [key]: value } : prize) });
  return <div className="space-y-5">
    <Card className="bg-card/70"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>تنظیمات کمپین</CardTitle>{canManage ? <Button disabled={saving || Math.abs(probabilityTotal - 100) > 0.000001 || form.prizes.length !== 10} onClick={onSave}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}ذخیره امن</Button> : <Badge variant="outline">فقط مشاهده</Badge>}</CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Field label="نام"><Input onChange={(event) => field("name", event.target.value)} value={form.name} /></Field>
      <Field label="شناسه URL"><Input className="font-mono" onChange={(event) => field("slug", event.target.value)} value={form.slug} /></Field>
      <Field label="وضعیت"><Select value={form.status} onValueChange={(value) => field("status", value as AdminWheelCampaignStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"].map((status) => <SelectItem key={status} value={status}><EnumLabel value={status} /></SelectItem>)}</SelectContent></Select></Field>
      <Field label="سقف روزانه هر کاربر"><Input min="1" onChange={(event) => field("dailySpinLimit", event.target.value)} type="number" value={form.dailySpinLimit} /></Field>
      <Field label="سقف کل هر کاربر"><Input onChange={(event) => field("perUserSpinLimit", event.target.value)} placeholder="بدون سقف" type="number" value={form.perUserSpinLimit} /></Field>
      <Field label="سقف کل کمپین"><Input onChange={(event) => field("globalSpinLimit", event.target.value)} placeholder="بدون سقف" type="number" value={form.globalSpinLimit} /></Field>
      <Field label="محدودیت درخواست در دقیقه"><Input min="1" onChange={(event) => field("rateLimitPerMinute", event.target.value)} type="number" value={form.rateLimitPerMinute} /></Field>
      <Field label="سقف چرخش جایزه‌ای"><Input min="1" onChange={(event) => field("extraSpinCapPerUser", event.target.value)} type="number" value={form.extraSpinCapPerUser} /></Field>
      <Field label="شروع"><Input onChange={(event) => field("startsAt", event.target.value)} type="datetime-local" value={form.startsAt} /></Field>
      <Field label="پایان"><Input onChange={(event) => field("endsAt", event.target.value)} type="datetime-local" value={form.endsAt} /></Field>
      <Toggle checked={form.firstSpinEnabled} label="اولین چرخش رایگان" onChange={(value) => field("firstSpinEnabled", value)} />
      <Toggle checked={form.requiresVerifiedMobile} label="الزام تأیید موبایل" onChange={(value) => field("requiresVerifiedMobile", value)} />
      <Toggle checked={form.requiresVerifiedEmail} label="الزام تأیید ایمیل" onChange={(value) => field("requiresVerifiedEmail", value)} />
    </CardContent></Card>
    <Card className="bg-card/70"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>دقیقاً ۱۰ جایزه قابل نمایش</CardTitle><p className="mt-2 text-xs text-muted-foreground">احتمالات فقط در پنل مدیریت نگهداری می‌شوند و هرگز به کلاینت عمومی ارسال نمی‌شوند.</p></div><Badge variant={Math.abs(probabilityTotal - 100) < 0.000001 ? "default" : "destructive"}>مجموع احتمال: {probabilityTotal.toFixed(6)}٪</Badge></div></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>عنوان فارسی / انگلیسی</TableHead><TableHead>نوع</TableHead><TableHead>مقدار</TableHead><TableHead>احتمال٪</TableHead><TableHead>موجودی</TableHead><TableHead>سقف روزانه</TableHead><TableHead>سقف کاربر</TableHead><TableHead>انقضا</TableHead><TableHead>فعال</TableHead></TableRow></TableHeader><TableBody>{form.prizes.map((prize, index) => <TableRow className={prize.isJackpot ? "bg-primary/5" : ""} key={prize.id ?? index}><TableCell className="font-bold">{index + 1}{prize.isJackpot ? <Trophy className="mt-1 size-4 text-primary" /> : null}</TableCell><TableCell className="min-w-56 space-y-2"><Input onChange={(event) => prizeField(index, "titleFa", event.target.value)} value={prize.titleFa} /><Input dir="ltr" onChange={(event) => prizeField(index, "titleEn", event.target.value)} value={prize.titleEn} /></TableCell><TableCell className="min-w-48"><Select value={prize.prizeType} onValueChange={(value) => prizeField(index, "prizeType", value as AdminWheelPrizeType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{prizeTypes.map((type) => <SelectItem key={type} value={type}><EnumLabel value={type} /></SelectItem>)}</SelectContent></Select></TableCell><TableCell><Input className="w-28" min="0" onChange={(event) => prizeField(index, "prizeValue", event.target.value)} type="number" value={prize.prizeValue} /></TableCell><TableCell><Input className="w-28 font-mono" min="0.000001" onChange={(event) => prizeField(index, "probability", event.target.value)} step="0.000001" type="number" value={prize.probability} /></TableCell><TableCell><Input className="w-24" onChange={(event) => prizeField(index, "stockLimit", event.target.value)} placeholder="∞" type="number" value={prize.stockLimit} /></TableCell><TableCell><Input className="w-24" onChange={(event) => prizeField(index, "dailyLimit", event.target.value)} placeholder="∞" type="number" value={prize.dailyLimit} /></TableCell><TableCell><Input className="w-24" onChange={(event) => prizeField(index, "perUserLimit", event.target.value)} placeholder="∞" type="number" value={prize.perUserLimit} /></TableCell><TableCell><Input className="w-20" min="1" onChange={(event) => prizeField(index, "rewardExpiryDays", event.target.value)} type="number" value={prize.rewardExpiryDays} /></TableCell><TableCell><Switch checked={prize.isActive} onCheckedChange={(value) => prizeField(index, "isActive", value)} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>;
}

function HistoryView({ canGrant, grant, loading, rows, search, submitting, onGrant, onSearch, onSubmit }: { canGrant: boolean; grant: { quantity: string; userId: string }; loading: boolean; onGrant: (value: { quantity: string; userId: string }) => void; onSearch: (value: string) => void; onSubmit: () => void; rows: Awaited<ReturnType<typeof getWheelSpins>>["items"]; search: string; submitting: boolean }) {
  return <div className="space-y-5">{canGrant ? <Card className="border-primary/25 bg-card/70"><CardHeader><CardTitle className="flex items-center gap-2"><TicketPlus className="size-5 text-primary" />اعطای شانس چرخش</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 md:flex-row"><Input onChange={(event) => onGrant({ ...grant, userId: event.target.value })} placeholder="شناسه کاربر" value={grant.userId} /><Input className="md:max-w-32" min="1" onChange={(event) => onGrant({ ...grant, quantity: event.target.value })} type="number" value={grant.quantity} /><Button disabled={submitting || !grant.userId || Number(grant.quantity) < 1} onClick={onSubmit}>{submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}اعطا با ثبت لاگ</Button></CardContent></Card> : null}<Card className="bg-card/70"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>تاریخچه غیرقابل حذف چرخش‌ها</CardTitle><div className="relative max-w-xs"><Search className="absolute end-3 top-3 size-4 text-muted-foreground" /><Input onChange={(event) => onSearch(event.target.value)} placeholder="کاربر یا توکن" value={search} /></div></div></CardHeader><CardContent>{loading ? <ShadowSkeleton className="h-72" /> : <Table><TableHeader><TableRow><TableHead>زمان</TableHead><TableHead>کاربر</TableHead><TableHead>جایزه</TableHead><TableHead>نوع</TableHead><TableHead>ریسک</TableHead></TableRow></TableHeader><TableBody>{rows.map((spin) => <TableRow key={spin.id}><TableCell>{formatPlatformDate(spin.createdAt, { dateStyle: "medium", timeStyle: "short" })}</TableCell><TableCell><p><AdminUserLink userId={spin.user.id}>{spin.user.email ?? spin.user.mobile ?? "—"}</AdminUserLink></p><p className="font-mono text-xs text-muted-foreground">{spin.user.id}</p></TableCell><TableCell>{spin.prize.titleFa}</TableCell><TableCell><Badge variant="outline"><EnumLabel value={spin.prize.prizeType} /></Badge></TableCell><TableCell>{spin.suspicious ? <Badge variant="destructive">مشکوک</Badge> : <Badge variant="secondary">سالم</Badge>}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card></div>;
}

function ClaimsView({ canManage, loading, rows, search, updating, onSearch, onStatus }: { canManage: boolean; loading: boolean; onSearch: (value: string) => void; onStatus: (id: string, status: string, trackingCode?: string) => void; rows: Awaited<ReturnType<typeof getWheelClaims>>["items"]; search: string; updating: boolean }) {
  const [tracking, setTracking] = useState<Record<string, string>>({});
  return <Card className="bg-card/70"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>ادعاها و تحویل جوایز فیزیکی</CardTitle><Input className="max-w-xs" onChange={(event) => onSearch(event.target.value)} placeholder="نام، موبایل یا کد رهگیری" value={search} /></div></CardHeader><CardContent>{loading ? <ShadowSkeleton className="h-72" /> : <Table><TableHeader><TableRow><TableHead>برنده</TableHead><TableHead>جایزه / آدرس</TableHead><TableHead>وضعیت</TableHead><TableHead>کد رهگیری</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader><TableBody>{rows.map((claim) => <TableRow key={claim.id}><TableCell><p><AdminUserLink userId={claim.user.id}>{claim.recipientName ?? claim.user.email ?? "—"}</AdminUserLink></p><p className="text-xs text-muted-foreground">{claim.recipientMobile ?? claim.user.mobile ?? claim.user.email}</p></TableCell><TableCell><p className="font-semibold">{claim.reward.prize.titleFa}</p><p className="max-w-sm text-xs leading-6 text-muted-foreground">{[claim.city, claim.address].filter(Boolean).join("، ")}</p></TableCell><TableCell><Badge><EnumLabel value={claim.status} /></Badge></TableCell><TableCell>{canManage ? <Input className="w-40 font-mono" onChange={(event) => setTracking((current) => ({ ...current, [claim.id]: event.target.value }))} placeholder={claim.trackingCode ?? "کد مرسوله"} value={tracking[claim.id] ?? ""} /> : claim.trackingCode ?? "—"}</TableCell><TableCell>{canManage ? <div className="flex gap-1"><Button disabled={updating} onClick={() => onStatus(claim.id, "PROCESSING")} size="sm" variant="outline">پردازش</Button><Button disabled={updating} onClick={() => onStatus(claim.id, "SHIPPED", tracking[claim.id] || claim.trackingCode || undefined)} size="sm">ارسال</Button><Button disabled={updating} onClick={() => onStatus(claim.id, "FULFILLED", tracking[claim.id] || claim.trackingCode || undefined)} size="sm" variant="secondary">تحویل</Button></div> : "—"}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>;
}

function AnalyticsView({ data, loading }: { data?: Awaited<ReturnType<typeof getWheelAnalytics>>; loading: boolean }) {
  if (loading || !data) return <ShadowSkeleton className="h-[520px] rounded-2xl" />;
  return <div className="space-y-5"><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Kpi icon={Users} label="بازیکن یکتا" value={data.funnel.uniquePlayers} /><Kpi icon={RotateCw} label="چرخش موفق" value={data.funnel.spins} /><Kpi icon={CheckCircle2} label="جوایز استفاده/ادعا" value={data.claimedRewards} /><Kpi icon={BarChart3} label="نرخ مشاهده به چرخش" value={`${(data.funnel.spinRate * 100).toFixed(1)}٪`} /></section><section className="grid gap-5 xl:grid-cols-[1fr_360px]"><Card className="bg-card/70"><CardHeader><CardTitle>عملکرد جوایز</CardTitle></CardHeader><CardContent className="space-y-3">{data.prizes.map((prize) => { const max = Math.max(...data.prizes.map((item) => item.wins), 1); return <div key={prize.id}><div className="flex justify-between text-sm"><span>{prize.titleFa}</span><strong>{prize.wins.toLocaleString("fa-IR")}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(prize.wins / max) * 100}%` }} /></div></div>; })}</CardContent></Card><Card className="bg-card/70"><CardHeader><CardTitle>قیف و ارزش</CardTitle></CardHeader><CardContent className="space-y-4"><Metric label="بازدید" value={data.funnel.views} /><Metric label="شروع ثبت‌نام" value={data.funnel.registrationInitiated} /><Metric label="شانس اعطاشده" value={data.grants.granted} /><Metric label="شانس باقیمانده" value={data.grants.remaining} /><Metric label="درآمد منتسب" value={`${Number(data.revenue).toLocaleString("fa-IR")} تومان`} /></CardContent></Card></section></div>;
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) { return <Card className="bg-card/70"><CardContent className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><p className="mt-5 text-xs text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl font-black">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</strong></CardContent></Card>; }
function Metric({ label, value }: { label: string; value: number | string }) { return <div className="flex justify-between rounded-xl border border-border p-3 text-sm"><span className="text-muted-foreground">{label}</span><strong>{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</strong></div>; }
function Field({ children, label }: { children: React.ReactNode; label: string }) { return <label className="space-y-2 text-xs font-semibold text-muted-foreground"><span>{label}</span>{children}</label>; }
function EnumLabel({ value }: { value: string }) { const { lang } = useI18n(); return <>{translateUiText(value, lang)}</>; }
function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) { return <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"><span>{label}</span><Switch checked={checked} onCheckedChange={onChange} /></label>; }

const prizeTypes: AdminWheelPrizeType[] = ["PHYSICAL_PRIZE", "WALLET_CREDIT", "FIXED_DISCOUNT", "PERCENTAGE_DISCOUNT", "EXTRA_SPIN"];

function emptyCampaignForm(): CampaignForm {
  const definitions: Array<Pick<PrizeForm, "isJackpot" | "maxDiscountAmount" | "probability" | "prizeType" | "prizeValue" | "stockLimit" | "titleEn" | "titleFa">> = [
    { isJackpot: true, maxDiscountAmount: "", probability: "0.001", prizeType: "PHYSICAL_PRIZE", prizeValue: "1", stockLimit: "1", titleEn: "Free Silver Bar", titleFa: "شمش نقره رایگان" },
    { isJackpot: false, maxDiscountAmount: "", probability: "0.499", prizeType: "WALLET_CREDIT", prizeValue: "50000", stockLimit: "", titleEn: "50,000 Toman Shopping Credit", titleFa: "۵۰٬۰۰۰ تومان اعتبار خرید" },
    { isJackpot: false, maxDiscountAmount: "", probability: "1", prizeType: "FIXED_DISCOUNT", prizeValue: "30000", stockLimit: "", titleEn: "30,000 Toman Discount", titleFa: "۳۰٬۰۰۰ تومان تخفیف" },
    { isJackpot: false, maxDiscountAmount: "", probability: "3", prizeType: "FIXED_DISCOUNT", prizeValue: "20000", stockLimit: "", titleEn: "20,000 Toman Discount", titleFa: "۲۰٬۰۰۰ تومان تخفیف" },
    { isJackpot: false, maxDiscountAmount: "", probability: "6", prizeType: "FIXED_DISCOUNT", prizeValue: "15000", stockLimit: "", titleEn: "15,000 Toman Discount", titleFa: "۱۵٬۰۰۰ تومان تخفیف" },
    { isJackpot: false, maxDiscountAmount: "", probability: "12", prizeType: "FIXED_DISCOUNT", prizeValue: "10000", stockLimit: "", titleEn: "10,000 Toman Discount", titleFa: "۱۰٬۰۰۰ تومان تخفیف" },
    { isJackpot: false, maxDiscountAmount: "100000", probability: "15", prizeType: "PERCENTAGE_DISCOUNT", prizeValue: "2", stockLimit: "", titleEn: "2% Discount", titleFa: "۲٪ تخفیف" },
    { isJackpot: false, maxDiscountAmount: "50000", probability: "28", prizeType: "PERCENTAGE_DISCOUNT", prizeValue: "1", stockLimit: "", titleEn: "1% Discount", titleFa: "۱٪ تخفیف" },
    { isJackpot: false, maxDiscountAmount: "", probability: "18.5", prizeType: "WALLET_CREDIT", prizeValue: "5000", stockLimit: "", titleEn: "5,000 Toman Shopping Credit", titleFa: "۵٬۰۰۰ تومان اعتبار خرید" },
    { isJackpot: false, maxDiscountAmount: "", probability: "16", prizeType: "EXTRA_SPIN", prizeValue: "1", stockLimit: "", titleEn: "One Extra Spin", titleFa: "یک شانس دوباره" },
  ];
  return { dailySpinLimit: "10", endsAt: "", extraSpinCapPerUser: "10", firstSpinEnabled: true, globalSpinLimit: "", name: "گردونه شانس نقره", perUserSpinLimit: "", prizes: definitions.map((prize, displayOrder) => ({ ...prize, dailyLimit: "", displayOrder, isActive: true, minimumPurchase: "0", perUserLimit: "", rewardExpiryDays: "30" })), rateLimitPerMinute: "6", requiresVerifiedEmail: false, requiresVerifiedMobile: false, slug: "silver-spin-to-win", startsAt: "", status: "DRAFT" };
}

function campaignToForm(campaign: AdminWheelCampaign): CampaignForm { return { dailySpinLimit: String(campaign.dailySpinLimit), endsAt: dateTimeLocal(campaign.endsAt), extraSpinCapPerUser: String(campaign.extraSpinCapPerUser), firstSpinEnabled: campaign.firstSpinEnabled, globalSpinLimit: campaign.globalSpinLimit ? String(campaign.globalSpinLimit) : "", name: campaign.name, perUserSpinLimit: campaign.perUserSpinLimit ? String(campaign.perUserSpinLimit) : "", prizes: campaign.prizes.filter((prize) => prize.isActive).sort((a, b) => a.displayOrder - b.displayOrder).map((prize) => ({ dailyLimit: prize.dailyLimit ? String(prize.dailyLimit) : "", displayOrder: prize.displayOrder, id: prize.id, isActive: prize.isActive, isJackpot: prize.isJackpot, maxDiscountAmount: prize.maxDiscountAmount ?? "", minimumPurchase: prize.minimumPurchase, perUserLimit: prize.perUserLimit ? String(prize.perUserLimit) : "", probability: prize.probability, prizeType: prize.prizeType, prizeValue: prize.prizeValue, rewardExpiryDays: String(prize.rewardExpiryDays), stockLimit: prize.stockLimit ? String(prize.stockLimit) : "", titleEn: prize.titleEn, titleFa: prize.titleFa })), rateLimitPerMinute: String(campaign.rateLimitPerMinute), requiresVerifiedEmail: campaign.requiresVerifiedEmail, requiresVerifiedMobile: campaign.requiresVerifiedMobile, slug: campaign.slug, startsAt: dateTimeLocal(campaign.startsAt), status: campaign.status }; }

function campaignInput(form: CampaignForm) { const nullableNumber = (value: string) => value ? Number(value) : null; return { dailySpinLimit: Number(form.dailySpinLimit), endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null, extraSpinCapPerUser: Number(form.extraSpinCapPerUser), firstSpinEnabled: form.firstSpinEnabled, globalSpinLimit: nullableNumber(form.globalSpinLimit), name: form.name, perUserSpinLimit: nullableNumber(form.perUserSpinLimit), prizes: form.prizes.map((prize) => ({ dailyLimit: nullableNumber(prize.dailyLimit), displayOrder: prize.displayOrder, id: prize.id, isActive: prize.isActive, isJackpot: prize.isJackpot, maxDiscountAmount: nullableNumber(prize.maxDiscountAmount), minimumPurchase: Number(prize.minimumPurchase || 0), perUserLimit: nullableNumber(prize.perUserLimit), probability: Number(prize.probability), prizeType: prize.prizeType, prizeValue: Number(prize.prizeValue), rewardExpiryDays: Number(prize.rewardExpiryDays), stockLimit: nullableNumber(prize.stockLimit), titleEn: prize.titleEn, titleFa: prize.titleFa })), rateLimitPerMinute: Number(form.rateLimitPerMinute), requiresVerifiedEmail: form.requiresVerifiedEmail, requiresVerifiedMobile: form.requiresVerifiedMobile, slug: form.slug, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null, status: form.status }; }
function dateTimeLocal(value?: string | null) { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
async function invalidateWheel(queryClient: ReturnType<typeof useQueryClient>, campaignId: string) { await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-wheel-campaigns"] }), queryClient.invalidateQueries({ queryKey: ["admin-wheel-campaign", campaignId] }), queryClient.invalidateQueries({ queryKey: ["admin-wheel-analytics", campaignId] }), queryClient.invalidateQueries({ queryKey: ["admin-wheel-spins", campaignId] })]); }
