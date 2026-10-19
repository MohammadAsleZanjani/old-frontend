"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { createAdminUser, getAdminOverview, type CreateAdminUserInput } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";

export function AdminUserCreatePage() {
  const router = useRouter();
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const isRtl = lang !== "en";
  const BackIcon = isRtl ? ArrowLeft : ArrowRight;
  const [form, setForm] = useState<CreateAdminUserInput>({ status: "ACTIVE" });
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const canCreate = hasAdminPermission(access, "users.create");
  const create = useMutation({
    mutationFn: () => {
      if (!form.email?.trim() && !form.mobile?.trim()) {
        throw new Error(t("Email or mobile is required"));
      }
      return createAdminUser({
        email: clean(form.email),
        firstName: clean(form.firstName),
        lastName: clean(form.lastName),
        mobile: clean(form.mobile),
        password: clean(form.password),
        status: form.status,
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("User could not be created")),
    onSuccess: (user) => {
      toast.success(t("User created"));
      router.replace(`/admin/users?search=${encodeURIComponent(user.email ?? user.mobile ?? user.id)}`);
    },
  });

  if (overview.isLoading) return <AdminShell><UserCreateSkeleton /></AdminShell>;
  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Admin page unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }
  if (!canCreate) {
    return (
      <AdminShell access={access}>
        <Alert>
          <AlertTitle>{t("Permission required")}</AlertTitle>
          <AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("Users & Access")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Create user")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("Create a customer account with contact details, first name, last name, status, and optional password.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={"/admin/users" as never}>
                <BackIcon className="size-4" />
                {t("Back to users")}
              </Link>
            </Button>
            <Button disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {t("Create user")}
            </Button>
          </div>
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle>{t("User details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label={t("First name")} value={form.firstName} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} />
            <Field label={t("Last name")} value={form.lastName} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} />
            <label className="grid gap-2 text-sm font-medium">
              {t("Status")}
              <Select dir={dir} onValueChange={(value) => setForm((current) => ({ ...current, status: value as CreateAdminUserInput["status"] }))} value={form.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t("Active")}</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">{t("Pending verification")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("Inactive")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("Suspended")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <Field dir="ltr" label={t("Mobile")} placeholder="0912..." value={form.mobile} onChange={(value) => setForm((current) => ({ ...current, mobile: value }))} />
            <Field dir="ltr" label={t("Email")} type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
            <Field className="md:col-span-2" dir="ltr" label={t("Password")} type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Field({ className, dir, label, onChange, placeholder, type = "text", value }: { className?: string; dir?: "ltr" | "rtl"; label: string; onChange: (value: string) => void; placeholder?: string; type?: string; value?: string }) {
  return (
    <label className={`grid gap-2 text-sm font-medium ${className ?? ""}`}>
      {label}
      <Input dir={dir} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value ?? ""} />
    </label>
  );
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function UserCreateSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <ShadowSkeleton className="h-96" />
    </div>
  );
}
