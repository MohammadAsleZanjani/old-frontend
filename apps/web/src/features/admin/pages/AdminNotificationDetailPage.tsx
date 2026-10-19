"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, ExternalLink } from "lucide-react";
import Link from "next/link";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { getAdminNotificationDetail, type AdminNotificationItem } from "@/features/admin/api/admin-notifications-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import type { ReactNode } from "react";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function AdminNotificationDetailPage({ notificationId }: { notificationId: string }) {
  const { lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = hasAdminPermission(access, "notifications.inbox.view");
  const notification = useQuery({
    enabled: allowed,
    queryFn: () => getAdminNotificationDetail(notificationId),
    queryKey: ["admin-notification-detail", notificationId],
    retry: 1,
  });

  if (overview.isLoading) return <AdminShell><DetailSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Notifications unavailable")}</AlertTitle><AlertDescription>{t(overview.error.message)}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription></Alert></AdminShell>;

  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("System / Notifications")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{notification.data?.title ?? t("Notification detail")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Inspect the notification payload, target user, delivery logs, metadata, and related action route.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={"/admin/system/operations" as never}>
                <ArrowLeft className="size-4" />
                {t("Back to notifications")}
              </Link>
            </Button>
            {notification.data?.actionUrl ? (
              <Button asChild>
                <Link href={notification.data.actionUrl as never}>
                  <ExternalLink className="size-4" />
                  {t("Open action")}
                </Link>
              </Button>
            ) : null}
          </div>
        </section>

        {notification.isLoading ? <DetailSkeleton /> : null}
        {notification.isError ? <Alert variant="destructive"><AlertTitle>{t("Notification unavailable")}</AlertTitle><AlertDescription>{t(notification.error.message)}</AlertDescription></Alert> : null}
        {notification.data ? <NotificationDetail notification={notification.data} /> : null}
      </div>
    </AdminShell>
  );
}

function NotificationDetail({ notification }: { notification: AdminNotificationItem }) {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const userName = [notification.user?.profile?.firstName, notification.user?.profile?.lastName].filter(Boolean).join(" ") || notification.user?.email || notification.userId;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="size-5 text-primary" />{t("Notification payload")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{t(labelize(notification.status))}</Badge>
              <Badge variant="outline">{t(labelize(notification.priority))}</Badge>
              <Badge variant="outline">{t(notification.event)}</Badge>
              {notification.entityType ? <Badge variant="secondary">{t(labelize(notification.entityType))}</Badge> : null}
            </div>
            <div className="rounded-lg border border-border bg-background/35 p-4">
              <p className="text-lg font-bold">{notification.title}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{notification.body}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label={t("Created")} value={formatDate(notification.createdAt)} />
              <Info label={t("Updated")} value={formatDate(notification.updatedAt)} />
              <Info label={t("Read")} value={notification.readAt ? formatDate(notification.readAt) : t("Not read")} />
              <Info label={t("Archived")} value={notification.archivedAt ? formatDate(notification.archivedAt) : t("Not archived")} />
              <Info label={t("Entity ID")} value={notification.entityId ?? t("None")} />
              <Info label={t("Action URL")} value={notification.actionUrl ?? t("None")} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{t("Delivery logs")}</CardTitle></CardHeader>
          <CardContent>
            {notification.logs?.length ? (
              <Table dir={dir}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Channel")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Recipient")}</TableHead>
                    <TableHead>{t("Attempts")}</TableHead>
                    <TableHead>{t("Updated")}</TableHead>
                    <TableHead>{t("Error")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notification.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{t(labelize(log.channel))}</TableCell>
                      <TableCell><Badge variant={log.status === "FAILED" ? "destructive" : "outline"}>{t(labelize(log.status))}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{log.recipient ?? t("In-app")}</TableCell>
                      <TableCell>{log.attempts}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(log.updatedAt)}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{log.error ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border bg-background/30 text-sm text-muted-foreground">{t("No delivery logs yet.")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{t("Target user")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Info label={t("Name")} value={<AdminUserLink userId={notification.userId}>{userName}</AdminUserLink>} />
            <Info label={t("User ID")} value={notification.userId} />
            <Info label={t("Email")} value={notification.user?.email ?? t("None")} />
            <Info label={t("Mobile")} value={formatMobileDisplay(notification.user?.mobile) || t("None")} />
          </CardContent>
        </Card>
        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader><CardTitle>{t("Metadata")}</CardTitle></CardHeader>
          <CardContent>
            <pre className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-6">
              {JSON.stringify(notification.metadata ?? {}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold">{value}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <ShadowSkeleton className="h-[30rem]" />
    </div>
  );
}

function labelize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}
