"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import {
  getAdminUser,
  updateAdminUserProfile,
  updateAdminUserStatus,
  type UserItem,
  type UserStatus,
} from "@/features/admin/api/admin-access-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { formatMobileDisplay, formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

const statuses: UserStatus[] = ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "INACTIVE"];

export function AdminUserDetailPage({ returnHref = "/admin/users", userId }: { returnHref?: string; userId: string }) {
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = hasAdminPermission(access, "users.view");
  const canUpdate = hasAdminPermission(access, "users.update");
  const user = useQuery({ enabled: allowed, queryFn: () => getAdminUser(userId), queryKey: ["admin-user-detail", userId], retry: 1 });

  if (overview.isLoading || user.isLoading) return <AdminShell><UserDetailSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>صفحه کاربران در دسترس نیست</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>مجوز لازم است</AlertTitle><AlertDescription>برای مشاهده و ویرایش پروفایل کاربران به مجوز مدیریت کاربران نیاز دارید.</AlertDescription></Alert></AdminShell>;
  if (user.isError) return <AdminShell access={access}><Alert variant="destructive"><AlertTitle>پروفایل کاربر پیدا نشد</AlertTitle><AlertDescription>{user.error.message}</AlertDescription></Alert></AdminShell>;
  if (!user.data) return <AdminShell access={access}><UserDetailSkeleton /></AdminShell>;

  return <AdminShell access={access}><UserProfileEditor canUpdate={canUpdate} key={`${user.data.id}-${user.data.updatedAt}`} returnHref={returnHref} user={user.data} /></AdminShell>;
}

function UserProfileEditor({ canUpdate, returnHref, user }: { canUpdate: boolean; returnHref: string; user: UserItem }) {
  const [firstName, setFirstName] = useState(user.profile?.firstName ?? "");
  const [lastName, setLastName] = useState(user.profile?.lastName ?? "");
  const [mobile, setMobile] = useState(formatMobileDisplay(user.mobile));
  const [idCardNo, setIdCardNo] = useState(user.profile?.idCardNo ?? "");
  const [status, setStatus] = useState<UserStatus>(user.status);
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", user.id] }),
      queryClient.invalidateQueries({ queryKey: ["admin-access-users"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-resource", "/admin/users"] }),
    ]);
  };
  const profileMutation = useMutation({
    mutationFn: () => updateAdminUserProfile(user.id, {
      firstName: firstName.trim(),
      idCardNo: idCardNo.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim() || undefined,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "ذخیره پروفایل انجام نشد."),
    onSuccess: async () => { await refresh(); toast.success("پروفایل کاربر ذخیره شد."); },
  });
  const statusMutation = useMutation({
    mutationFn: () => updateAdminUserStatus(user.id, status),
    onError: (error) => toast.error(error instanceof Error ? error.message : "تغییر وضعیت انجام نشد."),
    onSuccess: async () => { await refresh(); toast.success("وضعیت حساب به‌روزرسانی شد."); },
  });
  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.email || formatMobileDisplay(user.mobile) || "کاربر بدون نام";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2"><Badge variant="outline">مشتریان</Badge><div className="flex items-center gap-3"><UserRound className="size-8 text-primary" /><h2 className="text-2xl font-bold md:text-3xl">{name}</h2></div><p className="text-sm text-muted-foreground">مشاهده جزئیات حساب و ویرایش اطلاعات هویتی کاربر.</p></div>
        <Button asChild variant="outline"><Link href={returnHref as never}><ArrowRight className="size-4" />بازگشت</Link></Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Summary label="شناسه کاربر" value={user.id} mono />
        <Summary label="ایمیل" value={user.email || "ثبت نشده"} verified={!!user.emailVerifiedAt} />
        <Summary label="موبایل" value={formatMobileDisplay(user.mobile) || "ثبت نشده"} verified={!!user.mobileVerifiedAt} />
        <Summary label="آخرین ورود" value={formatDate(user.lastLoginAt)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="rounded-lg bg-card/70">
          <CardHeader><CardTitle>ویرایش پروفایل</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="نام"><Input disabled={!canUpdate} onChange={(event) => setFirstName(event.target.value)} value={firstName} /></Field>
            <Field label="نام خانوادگی"><Input disabled={!canUpdate} onChange={(event) => setLastName(event.target.value)} value={lastName} /></Field>
            <Field label="شماره موبایل"><Input disabled={!canUpdate} dir="ltr" onChange={(event) => setMobile(event.target.value)} placeholder="09123456789" value={mobile} /></Field>
            <Field label="کد ملی"><Input disabled={!canUpdate} dir="ltr" maxLength={32} onChange={(event) => setIdCardNo(event.target.value)} value={idCardNo} /></Field>
            {canUpdate ? <Button className="md:col-span-2" disabled={profileMutation.isPending} onClick={() => profileMutation.mutate()}><Save className="size-4" />{profileMutation.isPending ? "در حال ذخیره..." : "ذخیره پروفایل"}</Button> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg bg-card/70">
            <CardHeader><CardTitle>وضعیت حساب</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select disabled={!canUpdate} onValueChange={(value: UserStatus) => setStatus(value)} value={status}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{statusLabel(item)}</SelectItem>)}</SelectContent></Select>
              {canUpdate ? <Button className="w-full" disabled={statusMutation.isPending || status === user.status} onClick={() => statusMutation.mutate()} variant="outline">ذخیره وضعیت</Button> : null}
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card/70">
            <CardHeader><CardTitle>دسترسی و سابقه</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="نقش‌ها" value={user.roleMappings.map((mapping) => mapping.role.name).join("، ") || "بدون نقش"} />
              <Detail label="زبان" value={user.profile?.locale || "fa"} />
              <Detail label="منطقه زمانی" value={user.profile?.timezone || "Asia/Tehran"} />
              <Detail label="ایجاد حساب" value={formatDate(user.createdAt)} />
              <Detail label="آخرین تغییر" value={formatDate(user.updatedAt)} />
              {user.deletedAt ? <Detail label="حذف‌شده در" value={formatDate(user.deletedAt)} /> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, mono, value, verified }: { label: string; mono?: boolean; value: string; verified?: boolean }) {
  return <Card className="rounded-lg bg-card/70"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">{label}{verified ? <BadgeCheck className="size-4 text-emerald-500" /> : null}</CardTitle></CardHeader><CardContent><p className={`break-all text-sm font-semibold ${mono ? "font-mono" : ""}`} dir={mono ? "ltr" : undefined}>{value}</p></CardContent></Card>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <Label className="space-y-2"><span>{label}</span>{children}</Label>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 rounded-lg bg-background/35 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="text-left font-semibold">{value}</span></div>;
}

function formatDate(value?: string | null) {
  return value ? formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" }) : "ثبت نشده";
}

function statusLabel(status: UserStatus) {
  return ({ ACTIVE: "فعال", INACTIVE: "غیرفعال", PENDING_VERIFICATION: "در انتظار تأیید", SUSPENDED: "تعلیق‌شده" } as Record<UserStatus, string>)[status];
}

function UserDetailSkeleton() {
  return <div className="space-y-4"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}</div><ShadowSkeleton className="h-[30rem]" /></div>;
}
