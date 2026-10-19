"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { createAdminNotification, type NotificationChannel, type NotificationPriority } from "@/features/admin/api/admin-notifications-api";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Textarea } from "@/shared/ui/textarea";

const channels: NotificationChannel[] = ["IN_APP", "EMAIL", "SMS", "TELEGRAM", "PUSH"];
const priorities: NotificationPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

const defaultForm = {
  actionUrl: "",
  body: "",
  channels: ["IN_APP"] as NotificationChannel[],
  entityId: "",
  entityType: "system",
  event: "system.announcement",
  metadataText: "{}",
  priority: "NORMAL" as NotificationPriority,
  title: "",
  userId: "",
};

export function AdminNotificationCreatePage() {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const [form, setForm] = useState(defaultForm);
  const router = useRouter();
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = hasAdminPermission(access, "notifications.inbox.create");
  const create = useMutation({
    mutationFn: () => createAdminNotification({
      actionUrl: form.actionUrl.trim() || undefined,
      body: form.body.trim(),
      channels: form.channels,
      entityId: form.entityId.trim() || undefined,
      entityType: form.entityType.trim() || undefined,
      event: form.event.trim(),
      metadata: parseJsonRecord(form.metadataText),
      priority: form.priority,
      title: form.title.trim(),
      userId: form.userId.trim(),
    }),
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Notification could not be created")),
    onSuccess: ({ notification }) => {
      toast.success(t("Notification created."));
      void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-notification-logs"] });
      router.replace(`/admin/system/operations/${notification.id}`);
    },
  });

  if (overview.isLoading) return <AdminShell><CreateSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Notifications unavailable")}</AlertTitle><AlertDescription>{t(overview.error.message)}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription></Alert></AdminShell>;

  const canSubmit = form.userId.trim() && form.event.trim() && form.title.trim() && form.body.trim() && form.channels.length && isValidJson(form.metadataText);

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("System / Notifications")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Add notification")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Send a clear account notification to a selected user through the available communication channels.")}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/admin/system/operations" as never}>
              <ArrowLeft className="size-4" />
              {t("Back to notifications")}
            </Link>
          </Button>
        </section>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle>{t("Notification composer")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Label className="space-y-2">
                <span>{t("User ID")}</span>
                <Input onChange={(event) => setForm({ ...form, userId: event.target.value })} placeholder={t("Target user id")} value={form.userId} />
              </Label>
              <Label className="space-y-2">
                <span>{t("Event key")}</span>
                <Input onChange={(event) => setForm({ ...form, event: event.target.value })} placeholder={t("order.created")} value={form.event} />
              </Label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Label className="space-y-2">
                <span>{t("Priority")}</span>
                <Select dir={dir} onValueChange={(value) => setForm({ ...form, priority: value as NotificationPriority })} value={form.priority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map((item) => <SelectItem key={item} value={item}>{t(labelize(item))}</SelectItem>)}</SelectContent>
                </Select>
              </Label>
              <Label className="space-y-2">
                <span>{t("Entity type")}</span>
                <Input onChange={(event) => setForm({ ...form, entityType: event.target.value })} placeholder={t("order, payment, ticket...")} value={form.entityType} />
              </Label>
              <Label className="space-y-2">
                <span>{t("Entity ID")}</span>
                <Input onChange={(event) => setForm({ ...form, entityId: event.target.value })} placeholder={t("Related record id")} value={form.entityId} />
              </Label>
            </div>
            <Label className="space-y-2">
              <span>{t("Title")}</span>
              <Input onChange={(event) => setForm({ ...form, title: event.target.value })} value={form.title} />
            </Label>
            <Label className="space-y-2">
              <span>{t("Body")}</span>
              <Textarea className="min-h-36" onChange={(event) => setForm({ ...form, body: event.target.value })} value={form.body} />
            </Label>
            <Label className="space-y-2">
              <span>{t("Action URL")}</span>
              <Input onChange={(event) => setForm({ ...form, actionUrl: event.target.value })} placeholder="/user/notifications" value={form.actionUrl} />
            </Label>
            <div className="grid gap-2 rounded-lg border border-border bg-background/35 p-3">
              <p className="text-sm font-medium">{t("Channels")}</p>
              <div className="grid gap-2 md:grid-cols-5">
                {channels.map((channel) => (
                  <label className="flex items-center gap-2 text-sm" key={channel}>
                    <Checkbox
                      checked={form.channels.includes(channel)}
                      onCheckedChange={(checked) => setForm({
                        ...form,
                        channels: checked ? [...form.channels, channel] : form.channels.filter((item) => item !== channel),
                      })}
                    />
                    {t(labelize(channel))}
                  </label>
                ))}
              </div>
            </div>
            <Label className="space-y-2">
              <span>{t("Metadata JSON")}</span>
              <Textarea className="min-h-40 font-mono text-xs" onChange={(event) => setForm({ ...form, metadataText: event.target.value })} value={form.metadataText} />
            </Label>
            <Button className="w-full" disabled={create.isPending || !canSubmit} onClick={() => create.mutate()}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t("Create notification")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function CreateSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <ShadowSkeleton className="h-[42rem]" />
    </div>
  );
}

function parseJsonRecord(value: string) {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
}

function isValidJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function labelize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
