"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Filter, RotateCcw, Save, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  createAdminWalletAdjustment,
  getAdminWalletAdjustments,
  searchWalletUsers,
  type AdminWalletAdjustment,
  type WalletUserOption,
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
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type HistoryCurrency = "all" | "SILVER_GRAM" | "TOMAN";
type HistoryDirection = "all" | "DECREASE" | "INCREASE";

export function AdminWalletAdjustmentsPage({ initialUserId = "" }: { initialUserId?: string }) {
  const [userSearch, setUserSearch] = useState(initialUserId);
  const [selectedUser, setSelectedUser] = useState<WalletUserOption | null>(null);
  const [direction, setDirection] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [historySearch, setHistorySearch] = useState("");
  const [historyCurrency, setHistoryCurrency] = useState<HistoryCurrency>("all");
  const [historyDirection, setHistoryDirection] = useState<HistoryDirection>("all");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const adjustments = useQuery({
    queryFn: () => getAdminWalletAdjustments({
      currency: historyCurrency === "all" ? undefined : historyCurrency,
      direction: historyDirection === "all" ? undefined : historyDirection,
      page,
      pageSize: 20,
      search: historySearch.trim() || undefined,
      sortOrder,
      status: historyStatus === "all" ? undefined : historyStatus,
    }),
    queryKey: ["admin-wallet-adjustments", page, historySearch, historyCurrency, historyDirection, historyStatus, sortOrder],
    retry: 1,
  });
  const users = useQuery({
    enabled: userSearch.trim().length >= 2,
    queryFn: () => searchWalletUsers(userSearch.trim()),
    queryKey: ["admin-wallet-user-options", userSearch.trim()],
    retry: 1,
  });
  const access = overview.data?.access;
  const allowed = !!access && (access.isSuperAdmin || access.permissions.includes("silver.wallets.adjust"));
  useEffect(() => {
    if (!initialUserId || selectedUser || !users.data?.items.length) return;
    const matchedUser = users.data.items.find((user) => user.id === initialUserId);
    if (!matchedUser) return;
    setSelectedUser(matchedUser);
    setUserSearch(userLabel(matchedUser));
  }, [initialUserId, selectedUser, users.data?.items]);
  const mutation = useMutation({
    mutationFn: createAdminWalletAdjustment,
    onError: (error) => toast.error(error instanceof Error ? error.message : "اصلاح کیف پول انجام نشد."),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-wallet-adjustments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-resource", "/admin/silver/transactions"] }),
      ]);
      toast.success("اصلاح کیف پول ثبت شد.");
    },
  });

  if (overview.isLoading || adjustments.isLoading) {
    return <AdminShell><div className="space-y-4"><ShadowSkeleton className="h-28" /><ShadowSkeleton className="h-[30rem]" /></div></AdminShell>;
  }
  if (overview.error) {
    return <AdminShell><Alert variant="destructive"><AlertTitle>صفحه در دسترس نیست</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      amount: Number(form.get("amount")),
      currency: String(form.get("currency")) as "SILVER_GRAM" | "TOMAN",
      description: String(form.get("description")),
      direction,
      userId: selectedUser?.id ?? "",
    });
  };

  const resetHistoryFilters = () => {
    setHistorySearch("");
    setHistoryCurrency("all");
    setHistoryDirection("all");
    setHistoryStatus("all");
    setSortOrder("desc");
    setPage(1);
  };

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2"><Badge variant="outline">مالی</Badge>
            <div className="flex items-center gap-3"><CircleDollarSign className="size-7 text-primary" /><h2 className="text-2xl font-bold md:text-3xl">اصلاح موجودی کاربران</h2></div>
            <p className="text-sm leading-7 text-muted-foreground">افزایش یا کاهش کنترل‌شده موجودی تومانی و گرمی همراه با ثبت گردش و لاگ حسابرسی.</p>
          </div>
          <AdminExcelExportButton
            disabled={adjustments.isLoading || (adjustments.data?.total ?? 0) === 0}
            fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminWalletAdjustments({ currency: historyCurrency === "all" ? undefined : historyCurrency, direction: historyDirection === "all" ? undefined : historyDirection, page: exportPage, pageSize, search: historySearch.trim() || undefined, sortOrder, status: historyStatus === "all" ? undefined : historyStatus }))}
            filename="wallet-adjustments"
            sheetName="اصلاح موجودی کاربران"
          />
        </section>

        {!allowed ? <Alert><AlertTitle>مجوز لازم است</AlertTitle><AlertDescription>برای اصلاح کیف پول به مجوز مربوطه نیاز دارید.</AlertDescription></Alert> : null}

        <Card className="rounded-lg bg-card/70">
          <CardHeader><CardTitle>ثبت اصلاح جدید</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="userSearch">کاربر</Label>
                <Input
                  id="userSearch"
                  onChange={(event) => { setUserSearch(event.target.value); setSelectedUser(null); }}
                  placeholder="جست‌وجو با نام، نام خانوادگی، موبایل، ایمیل یا کد ملی"
                  value={userSearch}
                />
                {selectedUser ? <SelectedUser user={selectedUser} /> : null}
                {!selectedUser && users.data?.items.length ? (
                  <div className="max-h-64 overflow-auto rounded-xl border bg-popover p-1 shadow-lg">
                    {users.data.items.map((user) => (
                      <button
                        className="grid w-full gap-1 rounded-lg px-3 py-2 text-right text-sm hover:bg-muted md:grid-cols-[1fr_auto] md:items-center"
                        key={user.id}
                        onClick={() => { setSelectedUser(user); setUserSearch(userLabel(user)); }}
                        type="button"
                      >
                        <span><strong>{userLabel(user)}</strong><span className="mr-2 text-xs text-muted-foreground">{formatMobileDisplay(user.mobile) || user.email || "بدون اطلاعات تماس"}</span></span>
                        <span className="font-mono text-xs text-muted-foreground">{user.profile?.idCardNo ? `کد ملی ${user.profile.idCardNo}` : user.id}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {userSearch.trim().length >= 2 && !selectedUser && !users.isLoading && !users.data?.items.length ? <p className="text-xs text-muted-foreground">کاربری پیدا نشد.</p> : null}
              </div>
              <div className="space-y-2">
                <Label>نوع کیف پول</Label>
                <Select defaultValue="TOMAN" name="currency"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOMAN">کیف پول تومان</SelectItem><SelectItem value="SILVER_GRAM">کیف پول نقره (گرم)</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>نوع عملیات</Label>
                <Select onValueChange={(value) => setDirection(value as "INCREASE" | "DECREASE")} value={direction}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INCREASE">افزایش موجودی</SelectItem><SelectItem value="DECREASE">کاهش موجودی</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2"><Label htmlFor="amount">مقدار {direction === "INCREASE" ? "افزایش" : "کاهش"}</Label><Input id="amount" min="0.001" name="amount" placeholder="فقط عدد مثبت وارد کنید" required step="0.001" type="number" /></div>
              <div className="space-y-2"><Label htmlFor="description">دلیل اصلاح</Label><Input id="description" name="description" placeholder="شرح دقیق برای حسابرسی" required /></div>
              <div className="md:col-span-2"><Button disabled={!allowed || !selectedUser || mutation.isPending} type="submit"><Save className="size-4" />{mutation.isPending ? "در حال ثبت..." : `ثبت ${direction === "INCREASE" ? "افزایش" : "کاهش"} موجودی`}</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-lg bg-card/70">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div><CardTitle>تاریخچه اصلاح موجودی</CardTitle><p className="mt-1 text-xs text-muted-foreground">مشخصات کامل کاربر و جزئیات مالی هر اصلاح</p></div>
              <Badge variant="secondary">{formatCount(adjustments.data?.total ?? 0)} رکورد</Badge>
            </div>
            <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_180px_170px_160px_160px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  onChange={(event) => { setPage(1); setHistorySearch(event.target.value); }}
                  placeholder="نام، موبایل، ایمیل، کد ملی، شناسه یا شرح"
                  value={historySearch}
                />
              </div>
              <Select onValueChange={(value: HistoryCurrency) => { setPage(1); setHistoryCurrency(value); }} value={historyCurrency}>
                <SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">همه کیف پول‌ها</SelectItem><SelectItem value="TOMAN">کیف پول تومان</SelectItem><SelectItem value="SILVER_GRAM">کیف پول نقره</SelectItem></SelectContent>
              </Select>
              <Select onValueChange={(value: HistoryDirection) => { setPage(1); setHistoryDirection(value); }} value={historyDirection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">همه عملیات‌ها</SelectItem><SelectItem value="INCREASE">فقط افزایش</SelectItem><SelectItem value="DECREASE">فقط کاهش</SelectItem></SelectContent>
              </Select>
              <Select onValueChange={(value) => { setPage(1); setHistoryStatus(value); }} value={historyStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">همه وضعیت‌ها</SelectItem><SelectItem value="COMPLETED">تکمیل‌شده</SelectItem><SelectItem value="PENDING">در انتظار</SelectItem><SelectItem value="FAILED">ناموفق</SelectItem><SelectItem value="CANCELLED">لغوشده</SelectItem></SelectContent>
              </Select>
              <Select onValueChange={(value: "asc" | "desc") => { setPage(1); setSortOrder(value); }} value={sortOrder}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="desc">جدیدترین ابتدا</SelectItem><SelectItem value="asc">قدیمی‌ترین ابتدا</SelectItem></SelectContent>
              </Select>
              <Button onClick={resetHistoryFilters} variant="outline"><RotateCcw className="size-4" />پاک‌کردن</Button>
            </div>
          </CardHeader>
          <CardContent>
            {adjustments.isFetching ? <p className="mb-3 text-xs text-muted-foreground">در حال به‌روزرسانی نتایج...</p> : null}
            {adjustments.isError ? <Alert variant="destructive"><AlertTitle>تاریخچه در دسترس نیست</AlertTitle><AlertDescription>{adjustments.error.message}</AlertDescription></Alert> : null}
            {!adjustments.isError && adjustments.data?.items.length ? <AdjustmentTable rows={adjustments.data.items} /> : null}
            {!adjustments.isError && !adjustments.data?.items.length ? <div className="grid min-h-36 place-items-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">اصلاحی مطابق فیلترهای انتخاب‌شده پیدا نشد.</div> : null}
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">نمایش {formatCount(adjustments.data?.items.length ?? 0)} از {formatCount(adjustments.data?.total ?? 0)} رکورد · صفحه {formatCount(page)} از {formatCount(Math.max(1, adjustments.data?.totalPages ?? 1))}</p>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || adjustments.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">قبلی</Button>
                <Button disabled={page >= (adjustments.data?.totalPages ?? 1) || adjustments.isFetching} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">بعدی</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function AdjustmentTable({ rows }: { rows: AdminWalletAdjustment[] }) {
  return (
    <Table className="min-w-[1280px]">
      <TableHeader>
        <TableRow>
          <TableHead>نام و شناسه کاربر</TableHead>
          <TableHead>اطلاعات تماس</TableHead>
          <TableHead>کد ملی</TableHead>
          <TableHead>نوع و مقدار اصلاح</TableHead>
          <TableHead>موجودی پس از اصلاح</TableHead>
          <TableHead>شرح و ثبت‌کننده</TableHead>
          <TableHead>وضعیت و زمان</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const increase = Number(row.amount) >= 0;
          return (
            <TableRow key={row.id}>
              <TableCell className="min-w-52"><p><AdminUserLink userId={row.user.id}>{userLabel(row.user)}</AdminUserLink></p><p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{row.user.id}</p></TableCell>
              <TableCell className="min-w-48"><p dir="ltr">{formatMobileDisplay(row.user.mobile) || "—"}</p><p className="mt-1 text-xs text-muted-foreground" dir="ltr">{row.user.email || "بدون ایمیل"}</p></TableCell>
              <TableCell className="font-mono" dir="ltr">{row.user.profile?.idCardNo || "—"}</TableCell>
              <TableCell className="min-w-44"><Badge variant={increase ? "default" : "destructive"}>{increase ? "افزایش" : "کاهش"}</Badge><p className="mt-2 font-semibold tabular-nums">{formatWalletAmount(Math.abs(Number(row.amount)), row.wallet.currency)}</p><p className="mt-1 text-xs text-muted-foreground">{currencyLabel(row.wallet.currency)}</p></TableCell>
              <TableCell className="min-w-40 font-semibold tabular-nums">{formatWalletAmount(row.balanceAfter, row.wallet.currency)}</TableCell>
              <TableCell className="min-w-64"><p className="max-w-72 whitespace-normal leading-6">{row.description}</p>{row.reference ? <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">مرجع: {row.reference}</p> : null}{row.createdById ? <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">ثبت‌کننده: {row.createdById}</p> : null}<p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">تراکنش: {row.id}</p></TableCell>
              <TableCell className="min-w-44"><Badge variant="outline">{statusLabel(row.status)}</Badge><p className="mt-2 text-xs text-muted-foreground">{formatPlatformDate(row.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function SelectedUser({ user }: { user: WalletUserOption }) {
  return (
    <div className="grid gap-1 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm sm:grid-cols-2">
      <p>انتخاب‌شده: <strong>{userLabel(user)}</strong></p>
      <p className="text-muted-foreground">موبایل: <span dir="ltr">{formatMobileDisplay(user.mobile) || "—"}</span></p>
      <p className="text-muted-foreground">کد ملی: <span className="font-mono" dir="ltr">{user.profile?.idCardNo || "—"}</span></p>
      <p className="font-mono text-xs text-muted-foreground" dir="ltr">{user.id}</p>
    </div>
  );
}

function userLabel(user: WalletUserOption) {
  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ");
  return name || formatMobileDisplay(user.mobile) || user.email || "کاربر بدون نام";
}

function currencyLabel(currency: AdminWalletAdjustment["wallet"]["currency"]) {
  return currency === "TOMAN" ? "کیف پول تومان" : "کیف پول نقره";
}

function formatWalletAmount(value: number | string, currency: AdminWalletAdjustment["wallet"]["currency"]) {
  const number = Number(value);
  const safeValue = Number.isFinite(number) ? number : 0;
  const formatted = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: currency === "TOMAN" ? 0 : 3 }).format(safeValue);
  return `${formatted} ${currency === "TOMAN" ? "تومان" : "گرم"}`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function statusLabel(status: string) {
  return ({ CANCELLED: "لغوشده", COMPLETED: "تکمیل‌شده", FAILED: "ناموفق", PENDING: "در انتظار" } as Record<string, string>)[status] ?? status;
}
