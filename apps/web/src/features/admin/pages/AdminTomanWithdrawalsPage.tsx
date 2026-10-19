"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BanknoteArrowDown, CheckCircle2, Clock3, Filter, Landmark, Search, Send, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  getAdminTomanWithdrawals,
  reviewAdminTomanWithdrawal,
  type AdminTomanWithdrawal,
  type AdminTomanWithdrawalStatus,
  type ReviewAdminTomanWithdrawalInput,
} from "@/features/admin/api/admin-silver-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { formatMobileDisplay, formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

type ReviewAction = ReviewAdminTomanWithdrawalInput["action"];

export function AdminTomanWithdrawalsPage({ initialSearch, initialUserId }: { initialSearch?: string; initialUserId?: string }) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [status, setStatus] = useState<"all" | AdminTomanWithdrawalStatus>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminTomanWithdrawal | null>(null);
  const [action, setAction] = useState<ReviewAction>("APPROVE");
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const withdrawals = useQuery({
    queryFn: () => getAdminTomanWithdrawals({ page, pageSize: 20, search: search.trim() || undefined, status: status === "all" ? undefined : status, userId: initialUserId }),
    queryKey: ["admin-toman-withdrawals", initialUserId, page, search, status],
    refetchInterval: 15_000,
    retry: 1,
  });
  const access = overview.data?.access;
  const canView = !!access && (access.isSuperAdmin || access.permissions.includes("silver.withdrawals.view"));
  const canManage = !!access && (access.isSuperAdmin || access.permissions.includes("silver.withdrawals.manage"));
  const review = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewAdminTomanWithdrawalInput }) => reviewAdminTomanWithdrawal(id, input),
    onError: (error) => toast.error(error instanceof Error ? error.message : "به‌روزرسانی درخواست انجام نشد."),
    onSuccess: async () => {
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-toman-withdrawals"] });
      toast.success("وضعیت برداشت با موفقیت به‌روزرسانی شد.");
    },
  });

  if (overview.isLoading || withdrawals.isLoading) {
    return <AdminShell><div className="space-y-4"><ShadowSkeleton className="h-28" /><ShadowSkeleton className="h-32" /><ShadowSkeleton className="h-[32rem]" /></div></AdminShell>;
  }
  if (overview.error || withdrawals.error) {
    const error = overview.error ?? withdrawals.error;
    return <AdminShell><Alert variant="destructive"><AlertTitle>صفحه در دسترس نیست</AlertTitle><AlertDescription>{error instanceof Error ? error.message : "دریافت اطلاعات برداشت ناموفق بود."}</AlertDescription></Alert></AdminShell>;
  }

  const summary = withdrawals.data?.summary ?? {};
  const pendingCount = Number(summary.PENDING_REVIEW?.count ?? 0);
  const pendingAmount = Number(summary.PENDING_REVIEW?.amount ?? 0);
  const processingCount = Number(summary.APPROVED?.count ?? 0) + Number(summary.PROCESSING?.count ?? 0);
  const paidAmount = Number(summary.PAID?.amount ?? 0);

  const openReview = (item: AdminTomanWithdrawal) => {
    setSelected(item);
    setAction(defaultAction(item.status));
  };

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    review.mutate({
      id: selected.id,
      input: {
        action,
        adminNote: optionalFormValue(form, "adminNote"),
        provider: optionalFormValue(form, "provider"),
        providerTrackingCode: optionalFormValue(form, "providerTrackingCode"),
        providerTransferId: optionalFormValue(form, "providerTransferId"),
        rejectionReason: optionalFormValue(form, "rejectionReason"),
      },
    });
  };

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2"><Badge variant="outline">عملیات مالی</Badge>
            <div className="flex items-center gap-3"><BanknoteArrowDown className="size-7 text-primary" /><h2 className="text-2xl font-bold md:text-3xl">برداشت تومان</h2></div>
            <p className="text-sm leading-7 text-muted-foreground">بررسی مالکیت حساب بانکی، کنترل درخواست، ثبت انتقال و کد پیگیری با گردش مالی قابل حسابرسی.</p>
          </div>
          <AdminExcelExportButton
            disabled={!canView || withdrawals.isLoading || (withdrawals.data?.total ?? 0) === 0}
            fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminTomanWithdrawals({ page: exportPage, pageSize, search: search.trim() || undefined, status: status === "all" ? undefined : status, userId: initialUserId }))}
            filename="toman-withdrawals"
            sheetName="برداشت تومان"
          />
        </section>

        {!canView ? <Alert><AlertTitle>مجوز لازم است</AlertTitle><AlertDescription>برای مشاهده درخواست‌های برداشت به مجوز مالی مربوطه نیاز دارید.</AlertDescription></Alert> : null}

        {initialUserId ? <Alert><AlertTitle>برداشت‌های کاربر انتخاب‌شده</AlertTitle><AlertDescription className="flex flex-wrap items-center justify-between gap-3"><span>این فهرست فقط درخواست‌های برداشت متعلق به کاربر انتخاب‌شده را نشان می‌دهد.</span><Button asChild size="sm" variant="outline"><Link href="/admin/finance/withdrawals">نمایش همه کاربران</Link></Button></AlertDescription></Alert> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={Clock3} label="در انتظار بررسی" meta={formatToman(pendingAmount)} tone="amber" value={pendingCount} />
          <SummaryCard icon={ShieldCheck} label="تأیید یا در حال انتقال" meta="نیازمند پیگیری مالی" tone="sky" value={processingCount} />
          <SummaryCard icon={CheckCircle2} label="مبلغ واریزشده" meta="برداشت‌های نهایی" tone="emerald" value={formatToman(paidAmount)} />
          <SummaryCard icon={Landmark} label="کل درخواست‌ها" meta="تمام وضعیت‌ها" tone="slate" value={withdrawals.data?.total ?? 0} />
        </section>

        <Card className="rounded-xl bg-card/75">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>صف بررسی برداشت‌ها</CardTitle><p className="mt-1 text-xs text-muted-foreground">اطلاعات هویتی، شبا و سوابق انتقال را قبل از تصمیم کنترل کنید.</p></div><Badge variant="secondary">{formatCount(withdrawals.data?.total ?? 0)} درخواست</Badge></div>
            <div className="grid gap-3 md:grid-cols-[minmax(280px,1fr)_220px_auto]">
              <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="شماره درخواست، نام، موبایل، کد ملی، شبا یا کد پیگیری" value={search} /></div>
              <Select onValueChange={(value: "all" | AdminTomanWithdrawalStatus) => { setPage(1); setStatus(value); }} value={status}><SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه وضعیت‌ها</SelectItem>{withdrawalStatusOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
              <Button onClick={() => { setSearch(""); setStatus("all"); setPage(1); }} variant="outline">پاک‌کردن فیلتر</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader><TableRow><TableHead>درخواست</TableHead><TableHead>کاربر</TableHead><TableHead>مبلغ</TableHead><TableHead>حساب مقصد</TableHead><TableHead>وضعیت</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {canView && withdrawals.data?.items.map((item) => {
                    const statusMeta = withdrawalStatus(item.status);
                    return (
                      <TableRow key={item.id}>
                        <TableCell><strong className="font-mono text-xs">{item.requestNumber}</strong><p className="mt-1 text-xs text-muted-foreground">{formatPlatformDate(item.createdAt, { dateStyle: "medium", timeStyle: "short" }, "fa-IR")}</p></TableCell>
                        <TableCell><AdminUserLink userId={item.user.id}>{userName(item)}</AdminUserLink><p className="mt-1 text-xs text-muted-foreground">{formatMobileDisplay(item.user.mobile) || item.user.email || "—"}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.user.profile?.idCardNo ? `کد ملی ${item.user.profile.idCardNo}` : "کد ملی ثبت نشده"}</p></TableCell>
                        <TableCell><strong>{formatToman(item.amount)}</strong><p className="mt-1 text-xs text-muted-foreground">خالص: {formatToman(item.netAmount)}</p></TableCell>
                        <TableCell><strong className="text-xs">{item.bankAccount.bankName ?? "بانک نامشخص"}</strong><p className="mt-1 font-mono text-[11px]" dir="ltr">{item.bankAccount.iban}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.bankAccount.ownerName ?? "مالک احرازشده"}</p></TableCell>
                        <TableCell><Badge className={statusMeta.className} variant="outline">{statusMeta.label}</Badge>{item.providerTrackingCode ? <p className="mt-2 font-mono text-[11px] text-muted-foreground">{item.providerTrackingCode}</p> : null}</TableCell>
                        <TableCell>{canManage && !isFinalStatus(item.status) ? <Button onClick={() => openReview(item)} size="sm">بررسی و اقدام</Button> : <Button onClick={() => openReview(item)} size="sm" variant="outline">مشاهده جزئیات</Button>}</TableCell>
                      </TableRow>
                    );
                  })}
                  {canView && !withdrawals.data?.items.length ? <TableRow><TableCell className="h-32 text-center text-muted-foreground" colSpan={6}>درخواستی با این فیلترها پیدا نشد.</TableCell></TableRow> : null}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">صفحه {formatCount(withdrawals.data?.page ?? 1)} از {formatCount(withdrawals.data?.totalPages || 1)}</p><div className="flex gap-2"><Button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} size="sm" variant="outline">قبلی</Button><Button disabled={page >= (withdrawals.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} size="sm" variant="outline">بعدی</Button></div></div>
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={(open) => { if (!open) setSelected(null); }} open={Boolean(selected)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>بررسی درخواست {selected?.requestNumber}</DialogTitle><DialogDescription>پیش از ثبت تصمیم، مشخصات کاربر و حساب مقصد را تطبیق دهید. همه اقدامات در گزارش حسابرسی ثبت می‌شود.</DialogDescription></DialogHeader>
          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2"><Detail label="مبلغ برداشت" value={formatToman(selected.amount)} /><Detail label="کاربر" value={userName(selected)} /><Detail label="صاحب حساب" value={selected.bankAccount.ownerName ?? "مالک احرازشده"} /><Detail label="بانک" value={selected.bankAccount.bankName ?? "—"} /><Detail label="شماره شبا" mono value={selected.bankAccount.iban} /><Detail label="شماره حساب" mono value={selected.bankAccount.accountNumber ?? "—"} /><Detail label="شماره کارت" mono value={selected.bankAccount.cardNumber ?? "—"} /><Detail label="مرجع احراز بانکی" mono value={selected.bankAccount.verificationReference ?? "—"} /></div>
              {selected.userNote ? <Alert><AlertTitle>توضیح کاربر</AlertTitle><AlertDescription>{selected.userNote}</AlertDescription></Alert> : null}
              {selected.rejectionReason ? <Alert variant="destructive"><AlertTitle>دلیل رد یا خطا</AlertTitle><AlertDescription>{selected.rejectionReason}</AlertDescription></Alert> : null}
              {canManage && !isFinalStatus(selected.status) ? (
                <form className="space-y-4" onSubmit={submitReview}>
                  <div className="space-y-2"><Label>اقدام مالی</Label><Select onValueChange={(value: ReviewAction) => setAction(value)} value={action}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availableActions(selected.status).map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                  {action === "REJECT" || action === "MARK_FAILED" ? <div className="space-y-2"><Label htmlFor="rejectionReason">{action === "REJECT" ? "دلیل رد درخواست" : "شرح خطای انتقال"}</Label><Textarea defaultValue={selected.rejectionReason ?? ""} id="rejectionReason" name="rejectionReason" required={action === "REJECT"} /></div> : null}
                  {action === "MARK_PROCESSING" || action === "MARK_PAID" ? <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="provider">مسیر انتقال</Label><Input defaultValue={selected.provider || "manual_bank_transfer"} id="provider" name="provider" placeholder="سامانه یا بانک انتقال‌دهنده" /></div><div className="space-y-2"><Label htmlFor="providerTransferId">شناسه انتقال</Label><Input defaultValue={selected.providerTransferId ?? ""} id="providerTransferId" name="providerTransferId" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="providerTrackingCode">کد پیگیری بانکی {action === "MARK_PAID" ? "(الزامی)" : ""}</Label><Input defaultValue={selected.providerTrackingCode ?? ""} id="providerTrackingCode" name="providerTrackingCode" /></div></div> : null}
                  <div className="space-y-2"><Label htmlFor="adminNote">یادداشت داخلی واحد مالی</Label><Textarea defaultValue={selected.adminNote ?? ""} id="adminNote" name="adminNote" placeholder="نتیجه کنترل‌ها یا توضیح تکمیلی" /></div>
                  <Button className="w-full" disabled={review.isPending} type="submit">{review.isPending ? <Clock3 className="size-4 animate-spin" /> : actionIcon(action)}{actionLabel(action)}</Button>
                </form>
              ) : <Alert><AlertTitle>درخواست نهایی شده است</AlertTitle><AlertDescription>این درخواست دیگر عملیات مالی باز ندارد.</AlertDescription></Alert>}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

const withdrawalStatusOptions: Array<{ label: string; value: AdminTomanWithdrawalStatus }> = [
  { label: "در انتظار بررسی", value: "PENDING_REVIEW" }, { label: "تأییدشده", value: "APPROVED" }, { label: "در حال انتقال", value: "PROCESSING" }, { label: "واریزشده", value: "PAID" }, { label: "ردشده", value: "REJECTED" }, { label: "لغوشده", value: "CANCELLED" }, { label: "ناموفق", value: "FAILED" },
];

function SummaryCard({ icon: Icon, label, meta, tone, value }: { icon: typeof Clock3; label: string; meta: string; tone: "amber" | "emerald" | "sky" | "slate"; value: number | string }) {
  const toneClass = { amber: "bg-amber-500/10 text-amber-700", emerald: "bg-emerald-500/10 text-emerald-700", sky: "bg-sky-500/10 text-sky-700", slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300" }[tone];
  return <Card className="rounded-xl bg-card/75"><CardContent className="flex items-center gap-4 p-5"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${toneClass}`}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><strong className="mt-1 block text-lg">{typeof value === "number" ? formatCount(value) : value}</strong><p className="mt-1 truncate text-[11px] text-muted-foreground">{meta}</p></div></CardContent></Card>;
}

function Detail({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return <div><p className="text-[11px] text-muted-foreground">{label}</p><strong className={`mt-1 block break-all text-sm ${mono ? "font-mono" : ""}`} dir={mono ? "ltr" : undefined}>{value}</strong></div>;
}

function userName(item: AdminTomanWithdrawal) {
  return [item.user.profile?.firstName, item.user.profile?.lastName].filter(Boolean).join(" ") || item.user.email || item.user.mobile || "کاربر بدون نام";
}

function withdrawalStatus(status: AdminTomanWithdrawalStatus) {
  const map: Record<AdminTomanWithdrawalStatus, { className: string; label: string }> = {
    APPROVED: { className: "border-sky-500/30 bg-sky-500/10 text-sky-700", label: "تأییدشده" }, CANCELLED: { className: "border-border bg-muted text-muted-foreground", label: "لغوشده" }, FAILED: { className: "border-destructive/30 bg-destructive/10 text-destructive", label: "ناموفق" }, PAID: { className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700", label: "واریزشده" }, PENDING_REVIEW: { className: "border-amber-500/30 bg-amber-500/10 text-amber-700", label: "در انتظار بررسی" }, PROCESSING: { className: "border-violet-500/30 bg-violet-500/10 text-violet-700", label: "در حال انتقال" }, REJECTED: { className: "border-destructive/30 bg-destructive/10 text-destructive", label: "ردشده" },
  };
  return map[status];
}

function availableActions(status: AdminTomanWithdrawalStatus): Array<{ label: string; value: ReviewAction }> {
  if (status === "PENDING_REVIEW") return [{ label: "تأیید درخواست", value: "APPROVE" }, { label: "رد و بازگشت وجه", value: "REJECT" }];
  if (status === "APPROVED") return [{ label: "شروع انتقال بانکی", value: "MARK_PROCESSING" }, { label: "ثبت واریز موفق", value: "MARK_PAID" }, { label: "رد و بازگشت وجه", value: "REJECT" }, { label: "ثبت انتقال ناموفق", value: "MARK_FAILED" }];
  if (status === "PROCESSING") return [{ label: "ثبت واریز موفق", value: "MARK_PAID" }, { label: "ثبت انتقال ناموفق", value: "MARK_FAILED" }, { label: "رد و بازگشت وجه", value: "REJECT" }];
  return [];
}

function defaultAction(status: AdminTomanWithdrawalStatus): ReviewAction {
  return status === "PENDING_REVIEW" ? "APPROVE" : status === "APPROVED" ? "MARK_PROCESSING" : "MARK_PAID";
}

function isFinalStatus(status: AdminTomanWithdrawalStatus) {
  return ["PAID", "REJECTED", "CANCELLED", "FAILED"].includes(status);
}

function actionLabel(action: ReviewAction) {
  return { APPROVE: "تأیید درخواست", MARK_FAILED: "ثبت انتقال ناموفق و بازگشت وجه", MARK_PAID: "ثبت واریز نهایی", MARK_PROCESSING: "ثبت شروع انتقال", REJECT: "رد درخواست و بازگشت وجه" }[action];
}

function actionIcon(action: ReviewAction) {
  if (action === "APPROVE") return <ShieldCheck className="size-4" />;
  if (action === "MARK_PAID") return <CheckCircle2 className="size-4" />;
  if (action === "MARK_PROCESSING") return <Send className="size-4" />;
  return <XCircle className="size-4" />;
}

function optionalFormValue(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value || undefined;
}

function formatToman(value: number | string) {
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Number(value) || 0)} تومان`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}
