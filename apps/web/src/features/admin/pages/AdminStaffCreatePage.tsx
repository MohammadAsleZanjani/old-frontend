"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { createAdminStaff, getAdminRoles, type CreateAdminStaffInput } from "@/features/admin/api/admin-access-api";
import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

const emptyForm: CreateAdminStaffInput = { email: "", password: "", roleIds: [] };

export function AdminStaffCreatePage() {
  const router = useRouter();
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const BackIcon = lang === "en" ? ArrowLeft : ArrowRight;
  const [form, setForm] = useState<CreateAdminStaffInput>(emptyForm);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = hasAdminPermission(access, "users.create") && hasAdminPermission(access, "users.roles.assign");
  const roles = useQuery({
    enabled: allowed,
    queryFn: () => getAdminRoles({ page: 1, pageSize: 100 }),
    queryKey: ["admin-access-roles", "staff-create"],
    retry: 1,
  });
  const staffRoles = (roles.data?.items ?? []).filter((role) => role.name !== "CUSTOMER" && !role.deletedAt);
  const create = useMutation({
    mutationFn: () => createAdminStaff({
      ...form,
      email: form.email.trim(),
      firstName: clean(form.firstName),
      lastName: clean(form.lastName),
      mobile: clean(form.mobile),
      password: form.password,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Administrator could not be created")),
    onSuccess: (user) => {
      toast.success(t("Administrator created"));
      router.replace(`/admin/access/users?search=${encodeURIComponent(user.email ?? user.id)}`);
    },
  });

  if (overview.isLoading) return <AdminShell><StaffCreateSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Admin page unavailable")}</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Creating administrators requires both user and role management permissions.")}</AlertDescription></Alert></AdminShell>;

  const ready = form.email.trim() && form.password.length >= 8 && form.roleIds.length > 0;
  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2"><Badge variant="outline">{t("Users & Access")}</Badge><div className="flex items-center gap-3"><ShieldCheck className="size-8 text-primary" /><h2 className="text-2xl font-bold md:text-3xl">{t("Add administrator")}</h2></div><p className="text-sm text-muted-foreground">{t("Create a staff account and assign its administrative roles.")}</p></div>
          <div className="flex gap-2"><Button asChild variant="outline"><Link href="/admin/access/users"><BackIcon className="size-4" />{t("Back to administrators")}</Link></Button><Button disabled={!ready || create.isPending} onClick={() => create.mutate()}>{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}{t("Create administrator")}</Button></div>
        </section>
        <Card className="rounded-lg bg-card/70">
          <CardHeader><CardTitle>{t("Administrator details")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label={t("First name")} value={form.firstName} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} />
            <Field label={t("Last name")} value={form.lastName} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} />
            <Field dir="ltr" label={t("Email")} required type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
            <Field dir="ltr" label={t("Mobile")} value={form.mobile} onChange={(value) => setForm((current) => ({ ...current, mobile: value }))} />
            <Field className="md:col-span-2" dir="ltr" label={t("Password")} required type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} />
            <div className="space-y-3 md:col-span-2"><Label>{t("Administrative roles")}</Label><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{staffRoles.map((role) => <label className="flex items-start gap-3 rounded-lg border p-3 text-sm" key={role.id}><Checkbox checked={form.roleIds.includes(role.id)} onCheckedChange={(checked) => setForm((current) => ({ ...current, roleIds: checked ? [...current.roleIds, role.id] : current.roleIds.filter((id) => id !== role.id) }))} /><span><strong>{role.name}</strong>{role.description ? <small className="mt-1 block text-muted-foreground">{role.description}</small> : null}</span></label>)}</div>{roles.isError ? <p className="text-sm text-destructive">{roles.error.message}</p> : null}</div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Field({ className, dir, label, onChange, required, type = "text", value }: { className?: string; dir?: "ltr" | "rtl"; label: string; onChange: (value: string) => void; required?: boolean; type?: string; value?: string }) {
  return <Label className={`space-y-2 ${className ?? ""}`}><span>{label}</span><Input dir={dir} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value ?? ""} /></Label>;
}

function clean(value?: string) {
  return value?.trim() || undefined;
}

function StaffCreateSkeleton() {
  return <div className="space-y-6"><ShadowSkeleton className="h-28" /><ShadowSkeleton className="h-96" /></div>;
}
