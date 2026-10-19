"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Filter, Gift, Loader2, Plus, Save, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { getAdminSettings, upsertAdminSetting, type AdminSettingItem } from "@/features/admin/api/admin-system-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
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
import { Textarea } from "@/shared/ui/textarea";

const emptyForm = {
  group: "general",
  isPublic: false,
  key: "",
  valueText: "{}",
};

const sendGiftSetting = { group: "features", key: "sendGiftEnabled" } as const;

export function AdminSettingsPage() {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = hasAdminPermission(access, "settings.view");
  const canUpdate = hasAdminPermission(access, "settings.update");
  const settings = useQuery({
    enabled: allowed,
    queryFn: () => getAdminSettings({ group: group === "all" ? undefined : group, page, pageSize: 10, search, sortOrder }),
    queryKey: ["admin-settings", group, page, search, sortOrder],
    retry: 1,
  });
  const giftSending = useQuery({
    enabled: allowed,
    queryFn: () => getAdminSettings({ group: sendGiftSetting.group, page: 1, pageSize: 100, search: sendGiftSetting.key }),
    queryKey: ["admin-gift-sending-setting"],
    retry: 1,
  });
  const items = useMemo(() => settings.data?.items ?? [], [settings.data?.items]);
  const giftSendingEnabled = giftSending.data?.items.find((item) => item.group === sendGiftSetting.group && item.key === sendGiftSetting.key)?.value === true;
  const groups = useMemo(() => Array.from(new Set(["all", ...items.map((item) => item.group), form.group].filter(Boolean))), [form.group, items]);
  const metrics = [
    { label: t("Settings"), meta: t("Database records"), value: settings.data?.total ?? 0 },
    { label: t("Groups"), meta: t("Current page"), value: groups.filter((item) => item !== "all").length },
    { label: t("Public"), meta: t("Exposed to public services"), value: items.filter((item) => item.isPublic).length },
    { label: t("Private"), meta: t("Server-only settings"), value: items.filter((item) => !item.isPublic).length },
  ];
  const save = useMutation({
    mutationFn: () => upsertAdminSetting({
      group: form.group.trim(),
      isPublic: form.isPublic,
      key: form.key.trim(),
      value: parseSettingValue(form.valueText),
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Setting save failed")),
    onSuccess: () => {
      toast.success(t("Setting saved."));
      setForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });
  const toggleGiftSending = useMutation({
    mutationFn: (enabled: boolean) => upsertAdminSetting({
      group: sendGiftSetting.group,
      isPublic: false,
      key: sendGiftSetting.key,
      value: enabled,
    }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Gift sending setting could not be saved.")),
    onSuccess: (setting) => {
      toast.success(t(setting.value === true ? "Gift sending enabled." : "Gift sending disabled."));
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-gift-sending-setting"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
      ]);
    },
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <SettingsSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Settings unavailable")}</AlertTitle>
          <AlertDescription>{overview.error.message}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  if (!allowed) {
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
            <Badge className="w-fit" variant="outline">{t("System")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Settings")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Manage payment, branding, file storage, notification, language, and service connection settings.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!items.length} onClick={() => downloadSettings(items, t)} variant="outline">
              <Download className="size-4" />
              {t("Export")}
            </Button>
            {canUpdate ? <Button onClick={() => setForm(emptyForm)}>
              <Plus className="size-4" />
              {t("New setting")}
            </Button> : null}
          </div>
        </section>

        <Card className="rounded-lg border-fuchsia-500/25 bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600"><Gift className="size-5" /></span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{t("Gift sending")}</p>
                  <Badge variant={giftSendingEnabled ? "default" : "outline"}>{t(giftSendingEnabled ? "Enabled" : "Disabled")}</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{t("Controls whether customers can create new silver or product gifts. Existing gifts remain available for cancellation, claiming, and delivery.")}</p>
                {giftSending.isError ? <p className="text-xs text-destructive">{t("Gift sending setting is unavailable.")}</p> : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-background/40 px-4 py-3">
              <span className="text-sm font-medium">{t("Allow sending gifts")}</span>
              {giftSending.isLoading || toggleGiftSending.isPending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
              <Switch
                aria-label={t("Allow sending gifts")}
                checked={giftSendingEnabled}
                disabled={!canUpdate || giftSending.isLoading || giftSending.isError || toggleGiftSending.isPending}
                onCheckedChange={(checked) => toggleGiftSending.mutate(checked)}
              />
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]" key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{metric.meta}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5 text-primary" />
                  {t("Settings registry")}
                </CardTitle>
              </div>
              <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="ps-9"
                    onChange={(event) => {
                      setPage(1);
                      setSearch(event.target.value);
                    }}
                    placeholder={t("Search group or key")}
                    value={search}
                  />
                </div>
                <Select dir={dir} onValueChange={(value) => { setPage(1); setGroup(value); }} value={group}>
                  <SelectTrigger>
                    <Filter className="size-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((option) => <SelectItem key={option} value={option}>{option === "all" ? t("All groups") : option}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select dir={dir} onValueChange={(value) => setSortOrder(value as "asc" | "desc")} value={sortOrder}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t("A to Z")}</SelectItem>
                    <SelectItem value="desc">{t("Z to A")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {settings.isLoading ? <TableSkeleton /> : null}
              {settings.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>{t("Settings list unavailable")}</AlertTitle>
                  <AlertDescription>{settings.error.message}</AlertDescription>
                </Alert>
              ) : null}
              {!settings.isLoading && !settings.isError && items.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Setting")}</TableHead>
                      <TableHead>{t("Visibility")}</TableHead>
                      <TableHead>{t("Updated")}</TableHead>
                      <TableHead className="text-start">{t("Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{item.group} / {item.key}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{valuePreview(item.value)}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{item.isPublic ? t("Public") : t("Private")}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
                        <TableCell className="text-start">
                          {canUpdate ? <Button onClick={() => setForm(fromSetting(item))} size="sm" variant="outline">{t("Edit")}</Button> : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
              {!settings.isLoading && !settings.isError && !items.length ? (
                <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">
                  {t("No settings match the current filters.")}
                </div>
              ) : null}
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{t("Showing")} {items.length} {t("of")} {settings.data?.total ?? 0} {t("settings")}.</p>
                <div className="flex gap-2">
                  <Button disabled={page <= 1 || settings.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button>
                  <Button disabled={page >= (settings.data?.totalPages ?? 1) || settings.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {canUpdate ? <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Setting editor")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <span>{t("Group")}</span>
                  <Input onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))} value={form.group} />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>{t("Key")}</span>
                  <Input onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} value={form.key} />
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium">
                <span>{t("JSON value")}</span>
                <Textarea className="min-h-56 font-mono text-xs" onChange={(event) => setForm((current) => ({ ...current, valueText: event.target.value }))} value={form.valueText} />
              </label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/35 p-3">
                <div>
                  <p className="text-sm font-medium">{t("Public setting")}</p>
                  <p className="text-xs text-muted-foreground">{t("Public settings can be consumed by public platform services.")}</p>
                </div>
                <Switch checked={form.isPublic} onCheckedChange={(checked) => setForm((current) => ({ ...current, isPublic: checked }))} />
              </div>
              <Button
                className="w-full"
                disabled={save.isPending || !form.group.trim() || !form.key.trim() || !isValidJson(form.valueText)}
                onClick={() => save.mutate()}
              >
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {t("Save setting")}
              </Button>
            </CardContent>
          </Card> : null}
        </section>
      </div>
    </AdminShell>
  );
}

function fromSetting(item: AdminSettingItem) {
  return {
    group: item.group,
    isPublic: item.isPublic,
    key: item.key,
    valueText: JSON.stringify(item.value, null, 2),
  };
}

function parseSettingValue(value: string) {
  return JSON.parse(value) as unknown;
}

function isValidJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function valuePreview(value: unknown) {
  return JSON.stringify(value);
}

function downloadSettings(items: AdminSettingItem[], t: (text: string) => string) {
  if (typeof window === "undefined" || !items.length) return;
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "system-settings.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success(t("Settings export downloaded."));
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-12" key={index} />)}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}
      </div>
      <ShadowSkeleton className="h-[36rem]" />
    </div>
  );
}
