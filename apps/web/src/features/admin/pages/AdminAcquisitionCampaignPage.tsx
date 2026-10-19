"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Gift, Loader2, Megaphone, Plus, Save, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import {
  createAcquisitionPartner,
  getAcquisitionCampaigns,
  getAcquisitionPartners,
  getAcquisitionReport,
  reconcileAcquisitionCampaign,
  updateAcquisitionCampaign,
  updateAcquisitionPartner,
  updateAcquisitionPublication,
  type AcquisitionCampaign,
  type AcquisitionCampaignPartner,
  type AcquisitionCampaignStatus,
  type AcquisitionPartnerStatus,
  type AcquisitionPublicationStatus,
  type AcquisitionRewardType,
} from "@/features/admin/api/admin-acquisition-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

type CampaignForm = {
  attributionWindowDays: string;
  endsAt: string;
  maxBudget: string;
  maxRewards: string;
  name: string;
  qualificationWindowDays: string;
  rewardAmount: string;
  rewardType: AcquisitionRewardType;
  startsAt: string;
  status: AcquisitionCampaignStatus;
  termsFa: string;
};

const publicationStatuses: AcquisitionPublicationStatus[] = ["PLANNED", "READY", "PUBLISHED", "CANCELLED"];

export function AdminAcquisitionCampaignPage() {
  const queryClient = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CampaignForm>();
  const [newPartner, setNewPartner] = useState({ adType: "", code: "", instagramHandle: "", name: "" });
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const campaigns = useQuery({ queryFn: getAcquisitionCampaigns, queryKey: ["admin-acquisition-campaigns"], retry: 1 });
  const campaignId = selectedCampaignId || campaigns.data?.[0]?.id || "";
  const campaign = campaigns.data?.find((item) => item.id === campaignId);
  const report = useQuery({ enabled: Boolean(campaignId), queryFn: () => getAcquisitionReport(campaignId), queryKey: ["admin-acquisition-report", campaignId], retry: 1 });
  const partners = useQuery({ enabled: Boolean(campaignId), queryFn: () => getAcquisitionPartners(campaignId, search || undefined), queryKey: ["admin-acquisition-partners", campaignId, search], retry: 1 });
  const allowed = Boolean(overview.data?.access.isSuperAdmin || overview.data?.access.permissions.includes("referrals.manage"));

  useEffect(() => {
    if (campaign) setForm(formFromCampaign(campaign));
  }, [campaign]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-acquisition-campaigns"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-acquisition-report"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-acquisition-partners"] });
  };

  const saveCampaign = useMutation({
    mutationFn: () => {
      if (!campaign || !form) throw new Error("کمپین انتخاب نشده است.");
      return updateAcquisitionCampaign(campaign.id, {
        attributionWindowDays: Number(form.attributionWindowDays),
        endsAt: isoDate(form.endsAt),
        maxBudget: Number(form.maxBudget),
        maxRewards: Number(form.maxRewards),
        name: form.name.trim(),
        newUsersOnly: true,
        qualificationWindowDays: Number(form.qualificationWindowDays),
        requiresKyc: false,
        rewardAmount: Number(form.rewardAmount),
        rewardType: form.rewardType,
        startsAt: isoDate(form.startsAt),
        status: form.status,
        termsFa: form.termsFa.trim() || null,
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "ذخیره کمپین انجام نشد."),
    onSuccess: () => { toast.success("تنظیمات کمپین ذخیره شد."); refresh(); },
  });

  const activateCampaign = useMutation({
    mutationFn: () => {
      if (!campaign) throw new Error("کمپین انتخاب نشده است.");
      return updateAcquisitionCampaign(campaign.id, { status: "ACTIVE" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "فعال‌سازی کمپین انجام نشد."),
    onSuccess: () => {
      toast.success("کمپین فعال شد و کدهای فعال آن اکنون هنگام ثبت‌نام پذیرفته می‌شوند.");
      refresh();
    },
  });

  const reconcileCampaign = useMutation({
    mutationFn: () => reconcileAcquisitionCampaign(campaignId),
    onError: (error) => toast.error(error instanceof Error ? error.message : "بازبینی پاداش‌ها انجام نشد."),
    onSuccess: (result) => {
      toast.success(`${result.scannedUsers} کاربر بررسی و ${result.credited} پاداش جامانده واریز شد.`);
      refresh();
    },
  });

  const savePartner = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { adType?: string | null; code?: string; instagramHandle?: string | null; name?: string; status?: AcquisitionPartnerStatus } }) => updateAcquisitionPartner(id, input),
    onError: (error) => toast.error(error instanceof Error ? error.message : "به‌روزرسانی بلاگر انجام نشد."),
    onSuccess: () => { toast.success("اطلاعات بلاگر ذخیره شد."); refresh(); },
  });

  const savePublication = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AcquisitionPublicationStatus }) => updateAcquisitionPublication(id, { status }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "وضعیت انتشار ذخیره نشد."),
    onSuccess: refresh,
  });

  const addPartner = useMutation({
    mutationFn: () => createAcquisitionPartner({
      adType: newPartner.adType.trim() || undefined,
      campaignId,
      code: newPartner.code.trim() || undefined,
      instagramHandle: newPartner.instagramHandle.trim() || undefined,
      name: newPartner.name.trim(),
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "بلاگر جدید ثبت نشد."),
    onSuccess: () => {
      setNewPartner({ adType: "", code: "", instagramHandle: "", name: "" });
      toast.success("بلاگر و سه نوبت انتشار ایجاد شد.");
      refresh();
    },
  });

  if (overview.isLoading || campaigns.isLoading) return <AdminShell><PageSkeleton /></AdminShell>;
  if (overview.isError || campaigns.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>کمپین جذب در دسترس نیست</AlertTitle><AlertDescription>{overview.error?.message ?? campaigns.error?.message}</AlertDescription></Alert></AdminShell>;

  return <AdminShell access={overview.data?.access}>
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><Badge variant="outline">کمپین شروع پلتفرم</Badge><h2 className="mt-3 text-3xl font-black">جذب کاربر با لینک اختصاصی بلاگرها</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">انتساب اولین کلیک، ثبت‌نام، واریز فوری هدیه و احراز هویت بعدی هر کاربر در یک قیف قابل حسابرسی.</p></div>
        <div className="flex flex-wrap gap-2">
          <AdminExcelExportButton
            disabled={!campaignId || partners.isLoading || !(partners.data?.meta.total)}
            fetchRows={() => fetchAllAdminExportRows(async (exportPage, pageSize) => {
              const result = await getAcquisitionPartners(campaignId, search || undefined, exportPage, pageSize);
              return { items: result.data, totalPages: result.meta.totalPages };
            })}
            filename="acquisition-partners"
            sheetName="بلاگرها و وضعیت انتشار"
          />
          {campaigns.data?.length ? <Select onValueChange={setSelectedCampaignId} value={campaignId}><SelectTrigger className="w-full xl:w-80"><SelectValue /></SelectTrigger><SelectContent>{campaigns.data.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select> : null}
        </div>
      </section>

      {!allowed ? <Alert><ShieldCheck className="size-4" /><AlertTitle>دسترسی فقط خواندنی</AlertTitle><AlertDescription>برای تغییر کمپین و وضعیت انتشار، مجوز مدیریت معرفی لازم است.</AlertDescription></Alert> : null}
      {campaign && campaign.status !== "ACTIVE" ? <Alert><Megaphone className="size-4" /><AlertTitle>کمپین برای ثبت‌نام کاربران فعال نیست</AlertTitle><AlertDescription><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>وضعیت فعلی: {campaignStatusLabel(campaign.status)}. تا زمان فعال‌سازی، کدهای این کمپین در فرم ثبت‌نام پذیرفته نمی‌شوند.</span><Button disabled={!allowed || activateCampaign.isPending} onClick={() => activateCampaign.mutate()} size="sm">{activateCampaign.isPending ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />} فعال‌سازی کمپین</Button></div></AlertDescription></Alert> : null}

      <FunnelCards campaign={campaign} loading={report.isLoading} report={report.data?.funnel} />

      {campaign && form ? <CampaignEditor allowed={allowed} campaign={campaign} form={form} onChange={setForm} onReconcile={() => reconcileCampaign.mutate()} onSave={() => saveCampaign.mutate()} pending={saveCampaign.isPending || reconcileCampaign.isPending} /> : null}

      <Card className="rounded-2xl border-border bg-card/70">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>لیست بلاگرها و وضعیت انتشار</CardTitle><p className="mt-2 text-sm text-muted-foreground">هر لینک به‌صورت خودکار با اولین کلیک قفل می‌شود؛ وضعیت‌های ۱ تا ۳ مطابق فایل اولیه ایجاد شده‌اند.</p></div><Badge variant="outline">{partners.data?.meta.total ?? 0} بلاگر</Badge></div>
          <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => setSearch(event.target.value)} placeholder="جستجو با نام، آیدی، نوع تبلیغ یا کد لینک" value={search} /></div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {partners.isLoading ? <ShadowSkeleton className="h-96" /> : partners.isError ? <Alert variant="destructive"><AlertTitle>دریافت بلاگرها ناموفق بود</AlertTitle><AlertDescription>{partners.error.message}</AlertDescription></Alert> : <PartnerTable
            allowed={allowed}
            onPublication={(id, status) => savePublication.mutate({ id, status })}
            onSave={(id, input) => savePartner.mutate({ id, input })}
            pending={savePartner.isPending || savePublication.isPending}
            rows={partners.data?.data ?? []}
          />}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-primary/25 bg-card/70"><CardHeader><CardTitle>افزودن بلاگر جدید</CardTitle><p className="text-sm text-muted-foreground">کد لینک را خودتان انتخاب کنید؛ اگر خالی بماند، یک کد امن به‌صورت خودکار ساخته می‌شود.</p></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Field label="نام بلاگر"><Input onChange={(event) => setNewPartner((current) => ({ ...current, name: event.target.value }))} value={newPartner.name} /></Field><Field label="آیدی اینستاگرام"><Input dir="ltr" onChange={(event) => setNewPartner((current) => ({ ...current, instagramHandle: event.target.value }))} placeholder="username" value={newPartner.instagramHandle} /></Field><Field label="نوع تبلیغ"><Input onChange={(event) => setNewPartner((current) => ({ ...current, adType: event.target.value }))} value={newPartner.adType} /></Field><Field label="کد لینک (اختیاری)"><Input dir="ltr" maxLength={48} onChange={(event) => setNewPartner((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="MILAD-LAUNCH" value={newPartner.code} /></Field><div className="flex items-end"><Button className="w-full" disabled={!allowed || !campaignId || !newPartner.name.trim() || addPartner.isPending} onClick={() => addPartner.mutate()}>{addPartner.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} افزودن</Button></div></CardContent></Card>
    </div>
  </AdminShell>;
}

function FunnelCards({ campaign, loading, report }: { campaign?: AcquisitionCampaign; loading: boolean; report?: { clicks: number; registered: number; kycApproved: number; rewarded: number; rejected: number; clickToRegistrationRate: number; registrationToKycRate: number; registrationToRewardRate: number } }) {
  if (loading) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div>;
  const cards = [
    { icon: Megaphone, label: "کلیک", meta: `${report?.clickToRegistrationRate ?? 0}٪ تبدیل به ثبت‌نام`, value: report?.clicks ?? 0 },
    { icon: Users, label: "ثبت‌نام", meta: `${report?.registrationToKycRate ?? 0}٪ تکمیل احراز`, value: report?.registered ?? 0 },
    { icon: UserCheck, label: "احراز موفق", meta: "گام بعدی مستقل از پاداش", value: report?.kycApproved ?? 0 },
    { icon: Gift, label: "پاداش واریزشده", meta: `${report?.registrationToRewardRate ?? 0}٪ ثبت‌نام‌ها`, value: report?.rewarded ?? 0 },
    { icon: ShieldCheck, label: "بودجه مصرف‌شده", meta: `از ${formatToman(campaign?.maxBudget)}`, value: formatToman(campaign?.distributedAmount) },
  ];
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(({ icon: Icon, label, meta, value }) => <Card className="rounded-2xl border-border bg-card/70" key={label}><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{label}</p><Icon className="size-5 text-primary" /></div><strong className="mt-3 block text-2xl">{value}</strong><p className="mt-2 text-xs text-muted-foreground">{meta}</p></CardContent></Card>)}</section>;
}

function CampaignEditor({ allowed, campaign, form, onChange, onReconcile, onSave, pending }: { allowed: boolean; campaign: AcquisitionCampaign; form: CampaignForm; onChange: (form: CampaignForm) => void; onReconcile: () => void; onSave: () => void; pending: boolean }) {
  const field = (key: keyof CampaignForm, value: string) => onChange({ ...form, [key]: value });
  return <Card className="rounded-2xl border-border bg-card/70"><CardHeader><div className="flex items-center justify-between"><CardTitle>تنظیمات و کنترل بودجه</CardTitle><Badge variant={campaign.status === "ACTIVE" ? "default" : "outline"}>{campaign.status}</Badge></div></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <Field className="md:col-span-2" label="نام کمپین"><Input onChange={(event) => field("name", event.target.value)} value={form.name} /></Field>
    <Field label="وضعیت"><Select onValueChange={(value) => field("status", value)} value={form.status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">پیش‌نویس</SelectItem><SelectItem value="ACTIVE">فعال</SelectItem><SelectItem value="PAUSED">متوقف موقت</SelectItem><SelectItem value="ENDED">پایان‌یافته</SelectItem></SelectContent></Select></Field>
    <Field label="نوع اعتبار"><Select onValueChange={(value) => field("rewardType", value)} value={form.rewardType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SHOPPING_CREDIT">اعتبار خرید غیرقابل برداشت</SelectItem><SelectItem value="TOMAN_WALLET">کیف پول تومان</SelectItem></SelectContent></Select></Field>
    <Field label="مبلغ هر پاداش (تومان)"><Input min="1" onChange={(event) => field("rewardAmount", event.target.value)} type="number" value={form.rewardAmount} /></Field>
    <Field label="حداکثر کاربران"><Input min="1" onChange={(event) => field("maxRewards", event.target.value)} type="number" value={form.maxRewards} /></Field>
    <Field label="بودجه کل (تومان)"><Input min="1" onChange={(event) => field("maxBudget", event.target.value)} type="number" value={form.maxBudget} /></Field>
    <Field label="مهلت انتساب کلیک (روز)"><Input min="1" onChange={(event) => field("attributionWindowDays", event.target.value)} type="number" value={form.attributionWindowDays} /></Field>
    <Field label="مهلت نگهداری سابقه انتساب (روز)"><Input min="1" onChange={(event) => field("qualificationWindowDays", event.target.value)} type="number" value={form.qualificationWindowDays} /></Field>
    <Field label="شروع"><Input onChange={(event) => field("startsAt", event.target.value)} type="datetime-local" value={form.startsAt} /></Field>
    <Field label="پایان"><Input onChange={(event) => field("endsAt", event.target.value)} type="datetime-local" value={form.endsAt} /></Field>
    <Field className="md:col-span-2 xl:col-span-4" label="شرایط نمایش‌داده‌شده به کاربر"><Textarea className="min-h-24" onChange={(event) => field("termsFa", event.target.value)} value={form.termsFa} /></Field>
    <div className="md:col-span-2 xl:col-span-4 flex flex-wrap justify-end gap-2"><Button disabled={!allowed || pending} onClick={onReconcile} variant="outline"><ShieldCheck className="size-4" /> بازبینی پاداش‌های جامانده</Button><Button disabled={!allowed || pending || !form.name.trim()} onClick={onSave}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} ذخیره کمپین</Button></div>
  </CardContent></Card>;
}

function PartnerTable({ allowed, onPublication, onSave, pending, rows }: { allowed: boolean; onPublication: (id: string, status: AcquisitionPublicationStatus) => void; onSave: (id: string, input: { adType?: string | null; code?: string; instagramHandle?: string | null; name?: string; status?: AcquisitionPartnerStatus }) => void; pending: boolean; rows: AcquisitionCampaignPartner[] }) {
  if (!rows.length) return <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed text-sm text-muted-foreground">بلاگری با این جستجو پیدا نشد.</div>;
  return <Table><TableHeader><TableRow><TableHead>ردیف</TableHead><TableHead>بلاگر</TableHead><TableHead>نوع تبلیغ</TableHead><TableHead>لینک اختصاصی</TableHead><TableHead>انتشار ۱</TableHead><TableHead>انتشار ۲</TableHead><TableHead>انتشار ۳</TableHead><TableHead>قیف عملکرد</TableHead><TableHead>وضعیت</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader><TableBody>{rows.map((row, index) => <PartnerRow allowed={allowed} index={index} key={row.id} onPublication={onPublication} onSave={onSave} pending={pending} row={row} />)}</TableBody></Table>;
}

function PartnerRow({ allowed, index, onPublication, onSave, pending, row }: { allowed: boolean; index: number; onPublication: (id: string, status: AcquisitionPublicationStatus) => void; onSave: (id: string, input: { adType?: string | null; code?: string; instagramHandle?: string | null; name?: string; status?: AcquisitionPartnerStatus }) => void; pending: boolean; row: AcquisitionCampaignPartner }) {
  const [name, setName] = useState(row.partner.name);
  const [handle, setHandle] = useState(row.partner.instagramHandle ?? "");
  const [adType, setAdType] = useState(row.adType ?? "");
  const [code, setCode] = useState(row.code);
  const normalizedCode = code.trim().toUpperCase();
  const codeChanged = normalizedCode !== row.code;
  const codeValid = /^[A-Z0-9][A-Z0-9_-]{2,47}$/.test(normalizedCode);
  const savedLink = `${siteOrigin()}/r/${row.code}`;
  const previewLink = `${siteOrigin()}/r/${normalizedCode || row.code}`;
  const publications = useMemo(() => [1, 2, 3].map((sequence) => row.publications.find((item) => item.sequence === sequence)), [row.publications]);
  const sourceRow = row.partner.metadata?.sourceRow ?? index + 1;
  return <TableRow>
    <TableCell className="font-bold">{sourceRow}</TableCell>
    <TableCell className="min-w-52">
      <Input className="h-8" disabled={!allowed} onChange={(event) => setName(event.target.value)} value={name} />
      <div className="mt-2 flex items-center gap-2">
        <Input className="h-8" dir="ltr" disabled={!allowed} onChange={(event) => setHandle(event.target.value)} placeholder="آیدی ثبت نشده" value={handle} />
        {row.partner.metadata?.incomplete ? <Badge variant="destructive">ناقص</Badge> : null}
      </div>
    </TableCell>
    <TableCell className="min-w-44"><Input className="h-8" disabled={!allowed} onChange={(event) => setAdType(event.target.value)} placeholder="ثبت نشده" value={adType} /></TableCell>
    <TableCell className="min-w-72">
      <Input
        aria-label={`کد لینک ${row.partner.name}`}
        className="h-9 font-mono text-xs"
        dir="ltr"
        disabled={!allowed || pending}
        maxLength={48}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        value={code}
      />
      <p className={`mt-1 max-w-72 truncate text-[11px] ${codeChanged && !codeValid ? "text-destructive" : "text-muted-foreground"}`} dir={codeChanged && !codeValid ? "rtl" : "ltr"} title={previewLink}>
        {codeChanged && !codeValid ? "کد باید ۳ تا ۴۸ کاراکتر انگلیسی، عدد، - یا _ باشد." : previewLink}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button disabled={!allowed || pending || !codeChanged || !codeValid} onClick={() => onSave(row.id, { code: normalizedCode })} size="sm">
          {pending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} ذخیره کد
        </Button>
        <Button onClick={() => copyLink(savedLink)} size="sm" variant="outline"><Copy className="size-3" /> کپی لینک</Button>
      </div>
    </TableCell>
    {publications.map((publication, sequence) => <TableCell className="min-w-36" key={sequence}>{publication ? <Select disabled={!allowed || pending} onValueChange={(value) => onPublication(publication.id, value as AcquisitionPublicationStatus)} value={publication.status}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{publicationStatuses.map((status) => <SelectItem key={status} value={status}>{publicationLabel(status)}</SelectItem>)}</SelectContent></Select> : "—"}</TableCell>)}
    <TableCell className="min-w-36 text-xs"><p>{row.clicksCount} کلیک</p><p>{row.registrationsCount} ثبت‌نام</p><p>{row.kycApprovedCount} احراز</p><p className="font-bold text-emerald-600">{row.rewardsCount} پاداش</p></TableCell>
    <TableCell><Select disabled={!allowed || pending} onValueChange={(value) => onSave(row.id, { status: value as AcquisitionPartnerStatus })} value={row.status}><SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVE">فعال</SelectItem><SelectItem value="PAUSED">متوقف</SelectItem><SelectItem value="ARCHIVED">بایگانی</SelectItem></SelectContent></Select></TableCell>
    <TableCell><Button disabled={!allowed || pending || !name.trim()} onClick={() => onSave(row.id, { adType: adType.trim() || null, instagramHandle: handle.trim() || null, name: name.trim() })} size="sm" variant="outline">ذخیره اطلاعات</Button></TableCell>
  </TableRow>;
}

function Field({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) { return <div className={className}><Label className="mb-2 block">{label}</Label>{children}</div>; }
function PageSkeleton() { return <div className="space-y-4"><ShadowSkeleton className="h-32" /><div className="grid gap-4 md:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><ShadowSkeleton className="h-96" /></div>; }
function formFromCampaign(campaign: AcquisitionCampaign): CampaignForm { return { attributionWindowDays: String(campaign.attributionWindowDays), endsAt: localDate(campaign.endsAt), maxBudget: String(campaign.maxBudget), maxRewards: String(campaign.maxRewards), name: campaign.name, qualificationWindowDays: String(campaign.qualificationWindowDays), rewardAmount: String(campaign.rewardAmount), rewardType: campaign.rewardType, startsAt: localDate(campaign.startsAt), status: campaign.status, termsFa: campaign.termsFa ?? "" }; }
function localDate(value?: string | null) { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function isoDate(value: string) { return value ? new Date(value).toISOString() : null; }
function formatToman(value: unknown) { const amount = Number(value ?? 0); return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0)} تومان`; }
function publicationLabel(status: AcquisitionPublicationStatus) { return ({ CANCELLED: "لغوشده", PLANNED: "برنامه‌ریزی", PUBLISHED: "منتشرشده", READY: "آماده انتشار" } as const)[status]; }
function campaignStatusLabel(status: AcquisitionCampaignStatus) { return ({ ACTIVE: "فعال", DRAFT: "پیش‌نویس", ENDED: "پایان‌یافته", PAUSED: "متوقف" } as const)[status]; }
function siteOrigin() { if (typeof window !== "undefined") return window.location.origin; return process.env.NEXT_PUBLIC_SITE_URL ?? "https://noghre.land"; }
function copyLink(link: string) { void navigator.clipboard.writeText(link).then(() => toast.success("لینک اختصاصی کپی شد.")).catch(() => toast.error("کپی لینک انجام نشد.")); }
