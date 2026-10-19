"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, KeyRound, Loader2, LogOut, MonitorSmartphone, RefreshCw, ShieldCheck, UserCog } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { useAuth } from "@/shared/auth/AuthProvider";
import { platformAuth, type PlatformSession } from "@/shared/auth/platform-auth-client";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminProfilePage({ mode = "profile" }: { mode?: "profile" | "security" }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <AdminProfileSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Admin profile unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell access={overview.data?.access}>
      <AdminProfileContent mode={mode} />
    </AdminShell>
  );
}

function AdminProfileContent({ mode }: { mode: "profile" | "security" }) {
  const router = useRouter();
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const { refreshUser, signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [locale, setLocale] = useState("fa");
  const [timezone, setTimezone] = useState("Asia/Tehran");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setFirstName(user?.profile?.firstName ?? "");
    setLastName(user?.profile?.lastName ?? "");
    setLocale(user?.profile?.locale ?? "fa");
    setTimezone(user?.profile?.timezone ?? "Asia/Tehran");
  }, [user]);

  const sessions = useQuery({
    enabled: mode === "security",
    queryFn: async () => {
      const result = await platformAuth.sessions();
      if (result.error) throw result.error;
      return result.data ?? [];
    },
    queryKey: ["admin-profile-sessions"],
    retry: 1,
  });

  const profileName = useMemo(() => [firstName, lastName].filter(Boolean).join(" "), [firstName, lastName]);
  const initials = useMemo(() => (profileName || user?.email || "SA").slice(0, 2).toUpperCase(), [profileName, user?.email]);
  const roles = user?.roles?.length ? user.roles : ["Admin"];
  const isVerified = Boolean(user?.emailVerifiedAt);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const result = await platformAuth.updateProfile({ firstName, lastName, locale, timezone });
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Profile update failed")),
    onSuccess: async () => {
      await refreshUser();
      toast.success(t("Admin profile updated."));
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const result = await platformAuth.changePassword({ currentPassword, newPassword });
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Password change failed")),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success(t("Password changed and other sessions were revoked."));
      void queryClient.invalidateQueries({ queryKey: ["admin-profile-sessions"] });
    },
  });

  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await platformAuth.revokeSession(sessionId);
      if (result.error) throw result.error;
      return result.data;
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Session revoke failed")),
    onSuccess: () => {
      toast.success(t("Session revoked."));
      void queryClient.invalidateQueries({ queryKey: ["admin-profile-sessions"] });
    },
  });
  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="space-y-6 text-start">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-2">
          <Badge className="w-fit" variant="outline">{t("Admin Account")}</Badge>
          <h2 className="text-2xl font-bold md:text-3xl">{mode === "security" ? t("Security & Sessions") : t("My Profile")}</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            {t("Manage the authenticated administrator identity used for audit logs, support ownership, publishing actions, and secure back-office access.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void refreshUser()} variant="outline">
            <RefreshCw className="size-4" />
            {t("Refresh")}
          </Button>
          <Button onClick={() => void handleSignOut()} variant="destructive">
            <LogOut className="size-4" />
            {t("Logout")}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardContent className="space-y-5 p-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-20 border border-border shadow-[0_20px_50px_-34px_var(--glow)]">
                <AvatarFallback className="bg-gradient-gold text-2xl font-black text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">{profileName || t("مدیر نقره")}</p>
                <p className="truncate text-sm text-muted-foreground" dir="ltr">{user?.email ?? t("Not signed in")}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 text-sm">
              <ProfileStat label={t("Account status")} value={t(user?.status ?? "ACTIVE")} />
              <ProfileStat label={t("Email verification")} value={isVerified ? t("Verified") : t("Pending")} />
              <ProfileStat label={t("Locale")} value={locale || "fa"} />
              <ProfileStat label={t("Timezone")} value={timezone || "Asia/Tehran"} />
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => <Badge key={role}>{role}</Badge>)}
              {isVerified ? <Badge variant="outline"><CheckCircle2 className="size-3" />{t("Verified")}</Badge> : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="size-5 text-primary" />
                {t("Profile Details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input onChange={(event) => setFirstName(event.target.value)} placeholder={t("First name")} value={firstName} />
              <Input onChange={(event) => setLastName(event.target.value)} placeholder={t("Last name")} value={lastName} />
              <Input dir="ltr" readOnly value={user?.email ?? ""} />
              <Input onChange={(event) => setLocale(event.target.value)} placeholder={t("Locale")} value={locale} />
              <Input onChange={(event) => setTimezone(event.target.value)} placeholder={t("Timezone")} value={timezone} />
              <Button className="md:col-span-2" disabled={saveProfile.isPending || !firstName.trim()} onClick={() => saveProfile.mutate()}>
                {saveProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {t("Save profile details")}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                {t("Password Rotation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input onChange={(event) => setCurrentPassword(event.target.value)} placeholder={t("Current password")} type="password" value={currentPassword} />
              <Input onChange={(event) => setNewPassword(event.target.value)} placeholder={t("New password")} type="password" value={newPassword} />
              <Button className="w-full" disabled={changePassword.isPending || currentPassword.length < 1 || newPassword.length < 8} onClick={() => changePassword.mutate()}>
                {changePassword.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {t("Change password")}
              </Button>
              <p className="text-xs leading-6 text-muted-foreground">{t("Password changes revoke other active sessions and keep the current admin action auditable.")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorSmartphone className="size-5 text-primary" />
            {t("Login Sessions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode !== "security" ? (
            <Alert>
              <CalendarClock className="size-4" />
              <AlertTitle>{t("Session review available")}</AlertTitle>
              <AlertDescription>{t("Open Security from the admin account menu to inspect and revoke active sessions.")}</AlertDescription>
            </Alert>
          ) : null}
          {mode === "security" && sessions.isLoading ? <AdminProfileSkeleton compact /> : null}
          {mode === "security" && sessions.isError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("Sessions unavailable")}</AlertTitle>
              <AlertDescription>{sessions.error.message}</AlertDescription>
            </Alert>
          ) : null}
          {mode === "security" && !sessions.isLoading && !sessions.isError ? <SessionsTable items={sessions.data ?? []} revoke={(id) => revokeSession.mutate(id)} revokingId={revokeSession.variables} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionsTable({ items, revoke, revokingId }: { items: PlatformSession[]; revoke: (id: string) => void; revokingId?: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {t("No active sessions were returned for this account.")}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Device")}</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>{t("Last Used")}</TableHead>
            <TableHead>{t("Expires")}</TableHead>
            <TableHead className="text-end">{t("Action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{item.deviceName ?? t("Unknown device")}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{item.userAgent ?? t("No user agent")}</p>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground" dir="ltr">{item.ipAddress ?? "N/A"}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(item.lastUsedAt ?? item.createdAt)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(item.expiresAt)}</TableCell>
              <TableCell className="text-end">
                <Button disabled={revokingId === item.id || Boolean(item.revokedAt)} onClick={() => revoke(item.id)} size="sm" variant="outline">
                  {revokingId === item.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  {item.revokedAt ? t("Revoked") : t("Revoke")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background/40 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AdminProfileSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-3 md:grid-cols-4" : "space-y-6"}>
      <ShadowSkeleton className="h-28 rounded-lg" />
      <ShadowSkeleton className="h-64 rounded-lg" />
      {!compact ? <ShadowSkeleton className="h-52 rounded-lg" /> : null}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}
