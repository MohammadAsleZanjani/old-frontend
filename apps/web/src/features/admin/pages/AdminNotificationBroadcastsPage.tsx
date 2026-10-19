"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Loader2, MessageSquareText, RefreshCcw, Send, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  createAdminNotificationBroadcast,
  getAdminNotificationBroadcastPreview,
  getAdminNotificationBroadcasts,
  retryAdminNotificationBroadcast,
  type AdminNotificationBroadcast,
  type NotificationBroadcastStatus,
  type NotificationPriority,
} from "@/features/admin/api/admin-notifications-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Progress } from "@/shared/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Textarea } from "@/shared/ui/textarea";

const priorities: NotificationPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const statuses: Array<"ALL" | NotificationBroadcastStatus> = ["ALL", "QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"];
const emptyForm = { actionUrl: "/user/notifications", body: "", confirmed: false, priority: "NORMAL" as NotificationPriority, title: "" };

export function AdminNotificationBroadcastsPage() {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ALL" | NotificationBroadcastStatus>("ALL");
  const [reviewOpen, setReviewOpen] = useState(false);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const allowed = hasAdminPermission(access, "notifications.broadcasts.view");
  const canSend = hasAdminPermission(access, "notifications.broadcasts.send");
  const canRetry = hasAdminPermission(access, "notifications.broadcasts.retry");
  const preview = useQuery({
    enabled: allowed,
    queryFn: getAdminNotificationBroadcastPreview,
    queryKey: ["admin-notification-broadcast-preview"],
    retry: 1,
  });
  const broadcasts = useQuery({
    enabled: allowed,
    queryFn: () => getAdminNotificationBroadcasts({ page, pageSize: 10, status: status === "ALL" ? undefined : status }),
    queryKey: ["admin-notification-broadcasts", page, status],
    refetchInterval: (query) => query.state.data?.items.some((item) => ["QUEUED", "PROCESSING"].includes(item.status)) ? 5_000 : false,
    retry: 1,
  });
  const items = useMemo(() => broadcasts.data?.items ?? [], [broadcasts.data?.items]);
  const create = useMutation({
    mutationFn: () => createAdminNotificationBroadcast({
      actionUrl: form.actionUrl.trim() || undefined,
      body: form.body.trim(),
      confirmAllCustomers: true,
      priority: form.priority,
      title: form.title.trim(),
    }),
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Broadcast could not be queued")),
    onSuccess: () => {
      toast.success(t("Broadcast queued successfully."));
      setForm(emptyForm);
      setReviewOpen(false);
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ["admin-notification-broadcasts"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-notification-logs"] });
    },
  });
  const retry = useMutation({
    mutationFn: retryAdminNotificationBroadcast,
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Broadcast retry failed")),
    onSuccess: () => {
      toast.success(t("Broadcast queued for retry."));
      void queryClient.invalidateQueries({ queryKey: ["admin-notification-broadcasts"] });
    },
  });

  if (overview.isLoading) return <AdminShell><PageSkeleton /></AdminShell>;
  if (overview.isError) return <AdminShell><Alert variant="destructive"><AlertTitle>{t("Notifications unavailable")}</AlertTitle><AlertDescription>{overview.error.message}</AlertDescription></Alert></AdminShell>;
  if (!allowed) return <AdminShell access={access}><Alert><AlertTitle>{t("Permission required")}</AlertTitle><AlertDescription>{t("Your account cannot use this section. Ask a senior administrator to review your role.")}</AlertDescription></Alert></AdminShell>;

  const canReview = Boolean(canSend && form.title.trim() && form.body.trim() && form.confirmed && preview.data?.totalRecipients && !create.isPending);
  return (
    <AdminShell access={access}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge className="w-fit" variant="outline">{t("System / Notifications")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{t("Send SMS and notification to all users")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{t("Create one controlled broadcast for every customer account. In-app notifications are created in batches and SMS delivery is queued separately to protect the platform.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={broadcasts.isLoading || (broadcasts.data?.total ?? 0) === 0}
              fetchRows={() => fetchAllAdminExportRows((exportPage, pageSize) => getAdminNotificationBroadcasts({ page: exportPage, pageSize, status: status === "ALL" ? undefined : status }))}
              filename="notification-broadcasts"
              sheetName={t("Notification broadcasts")}
            />
            <Button asChild variant="outline"><Link href={"/admin/system/operations" as never}>{t("Back to notifications")}</Link></Button>
          </div>
        </section>

        {preview.isError ? <Alert variant="destructive"><AlertTitle>{t("Audience preview unavailable")}</AlertTitle><AlertDescription>{preview.error.message}</AlertDescription></Alert> : null}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label={t("All customer accounts")} loading={preview.isLoading} value={preview.data?.totalRecipients ?? 0} />
          <Metric icon={MessageSquareText} label={t("SMS recipients with mobile")} loading={preview.isLoading} value={preview.data?.smsRecipients ?? 0} />
          <Metric icon={BellRing} label={t("In-app recipients")} loading={preview.isLoading} value={preview.data?.totalRecipients ?? 0} />
          <Metric icon={ShieldCheck} label={t("Active customer accounts")} loading={preview.isLoading} value={preview.data?.active ?? 0} />
        </section>

        {canSend ? <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader><CardTitle>{t("All-user message composer")}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Label className="space-y-2">
                  <span>{t("Subject")}</span>
                  <Input maxLength={100} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t("SMS %token and notification title")} value={form.title} />
                  <span className="block text-end text-xs text-muted-foreground">{form.title.length}/100</span>
                </Label>
                <Label className="space-y-2">
                  <span>{t("Priority")}</span>
                  <Select dir={dir} onValueChange={(value) => setForm({ ...form, priority: value as NotificationPriority })} value={form.priority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{priorities.map((item) => <SelectItem key={item} value={item}>{t(labelize(item))}</SelectItem>)}</SelectContent>
                  </Select>
                </Label>
              </div>
              <Label className="space-y-2">
                <span>{t("Message")}</span>
                <Textarea className="min-h-44" maxLength={500} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder={t("SMS %token20 and in-app notification message")} value={form.body} />
                <span className="block text-end text-xs text-muted-foreground">{form.body.length}/500</span>
              </Label>
              <Label className="space-y-2">
                <span>{t("Notification action URL")}</span>
                <Input maxLength={500} onChange={(event) => setForm({ ...form, actionUrl: event.target.value })} placeholder="/user/notifications" value={form.actionUrl} />
              </Label>
              <Alert>
                <TriangleAlert className="size-4" />
                <AlertTitle>{t("Large audience confirmation")}</AlertTitle>
                <AlertDescription>{t("This operation creates an in-app notification for every customer account and queues an SMS for every account with a mobile number. It does not include staff accounts.")}</AlertDescription>
              </Alert>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/40 p-4 text-sm leading-6">
                <Checkbox checked={form.confirmed} className="mt-1" onCheckedChange={(checked) => setForm({ ...form, confirmed: checked === true })} />
                <span>{t("I reviewed the audience, subject, and message and confirm sending to all customer accounts.")}</span>
              </label>
              <Button className="w-full" disabled={!canReview} onClick={() => setReviewOpen(true)} size="lg">
                <Send className="size-4" />{t("Review and queue broadcast")}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-lg border-border bg-card/70">
              <CardHeader><CardTitle>{t("Kavenegar template mapping")}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Mapping label={t("Template")} value="notification" />
                <Mapping label="%token" value={form.title.trim() || t("Subject will appear here")} />
                <Mapping label="%token20" value={form.body.trim() || t("Message will appear here")} />
              </CardContent>
            </Card>
            <Card className="rounded-lg border-border bg-card/70">
              <CardHeader><CardTitle>{t("Audience details")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Detail label={t("Active")} value={preview.data?.active ?? 0} />
                <Detail label={t("Pending verification")} value={preview.data?.pendingVerification ?? 0} />
                <Detail label={t("Inactive")} value={preview.data?.inactive ?? 0} />
                <Detail label={t("Suspended")} value={preview.data?.suspended ?? 0} />
              </CardContent>
            </Card>
          </div>
        </div> : null}

        <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>{t("Broadcast history and progress")}</CardTitle>
            <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value as typeof status); }} value={status}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{item === "ALL" ? t("All statuses") : t(labelize(item))}</SelectItem>)}</SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {broadcasts.isLoading ? <HistorySkeleton /> : null}
            {broadcasts.isError ? <Alert variant="destructive"><AlertTitle>{t("Broadcast history unavailable")}</AlertTitle><AlertDescription>{broadcasts.error.message}</AlertDescription></Alert> : null}
            {!broadcasts.isLoading && !broadcasts.isError && items.length ? <BroadcastTable canRetry={canRetry} items={items} onRetry={(id) => retry.mutate(id)} retryingId={retry.isPending ? retry.variables : undefined} /> : null}
            {!broadcasts.isLoading && !broadcasts.isError && !items.length ? <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">{t("No broadcast campaigns found.")}</div> : null}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4"><p className="text-sm text-muted-foreground">{t("Total")}: {(broadcasts.data?.meta?.total ?? 0).toLocaleString(lang)}</p><div className="flex gap-2"><Button disabled={page <= 1 || broadcasts.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button><Button disabled={page >= (broadcasts.data?.meta?.totalPages ?? 1) || broadcasts.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button></div></div>
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={setReviewOpen} open={reviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("Final broadcast confirmation")}</DialogTitle><DialogDescription>{t("After confirmation, messages are queued in batches. Review the exact audience and token values one last time.")}</DialogDescription></DialogHeader>
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <Detail label={t("In-app recipients")} value={preview.data?.totalRecipients ?? 0} />
            <Detail label={t("SMS recipients with mobile")} value={preview.data?.smsRecipients ?? 0} />
            <Mapping label="%token" value={form.title.trim()} />
            <Mapping label="%token20" value={form.body.trim()} />
          </div>
          <Alert variant="destructive"><TriangleAlert className="size-4" /><AlertTitle>{t("Queueing begins immediately")}</AlertTitle><AlertDescription>{t("Do not confirm if the subject, message, or audience is not correct.")}</AlertDescription></Alert>
          <DialogFooter><Button disabled={create.isPending} onClick={() => setReviewOpen(false)} variant="outline">{t("Cancel")}</Button><Button disabled={create.isPending} onClick={() => create.mutate()}>{create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{t("Confirm and queue for all users")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function BroadcastTable({ canRetry, items, onRetry, retryingId }: { canRetry: boolean; items: AdminNotificationBroadcast[]; onRetry: (id: string) => void; retryingId?: string }) {
  const { lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  return <div className="overflow-x-auto"><Table className="min-w-[1200px]"><TableHeader><TableRow><TableHead>{t("Campaign")}</TableHead><TableHead>{t("Status and progress")}</TableHead><TableHead>{t("Audience")}</TableHead><TableHead>{t("Queued results")}</TableHead><TableHead>{t("Requested by")}</TableHead><TableHead>{t("Created")}</TableHead><TableHead>{t("Actions")}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="max-w-80 align-top"><p className="font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p><p className="mt-2 font-mono text-[11px] text-muted-foreground" dir="ltr">{item.id}</p></TableCell><TableCell className="min-w-56 align-top"><Badge variant={statusVariant(item.status)}>{t(labelize(item.status))}</Badge><div className="mt-3 flex items-center gap-3"><Progress className="h-2" value={item.progress} /><span className="text-xs tabular-nums">{item.progress}%</span></div>{item.error ? <p className="mt-2 line-clamp-2 text-xs text-destructive" title={item.error}>{item.error}</p> : null}</TableCell><TableCell className="align-top text-sm"><p>{t("All")}: {item.totalRecipients.toLocaleString(lang)}</p><p className="text-muted-foreground">{t("Processed")}: {item.processedRecipients.toLocaleString(lang)}</p><p className="text-muted-foreground">{t("With mobile")}: {item.smsRecipients.toLocaleString(lang)}</p></TableCell><TableCell className="align-top text-sm"><p>{t("In-app")}: {item.inAppCreated.toLocaleString(lang)}</p><p className="text-muted-foreground">{t("SMS queued")}: {item.smsQueued.toLocaleString(lang)}</p></TableCell><TableCell className="align-top text-sm">{requesterName(item) || item.requestedById}</TableCell><TableCell className="min-w-48 align-top text-sm text-muted-foreground">{formatPlatformDate(item.createdAt, { dateStyle: "medium", timeStyle: "short" }, lang)}</TableCell><TableCell className="align-top">{canRetry && item.status === "FAILED" ? <Button disabled={retryingId === item.id} onClick={() => onRetry(item.id)} size="sm" variant="outline">{retryingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}{t("Retry")}</Button> : "—"}</TableCell></TableRow>)}</TableBody></Table></div>;
}

function Metric({ icon: Icon, label, loading, value }: { icon: typeof Users; label: string; loading: boolean; value: number }) { const { lang } = useI18n(); return <Card className="rounded-lg border-border bg-card/70"><CardContent className="flex items-center gap-4 p-5"><div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div><div><p className="text-sm text-muted-foreground">{label}</p>{loading ? <ShadowSkeleton className="mt-2 h-7 w-24" /> : <p className="mt-1 text-2xl font-bold">{value.toLocaleString(lang)}</p>}</div></CardContent></Card>; }
function Mapping({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-background/50 p-3"><p className="font-mono text-xs text-primary" dir="ltr">{label}</p><p className="mt-2 break-words leading-6">{value}</p></div>; }
function Detail({ label, value }: { label: string; value: number }) { const { lang } = useI18n(); return <div className="flex items-center justify-between gap-4 border-b border-border/70 py-2 last:border-0"><span className="text-muted-foreground">{label}</span><strong>{value.toLocaleString(lang)}</strong></div>; }
function requesterName(item: AdminNotificationBroadcast) { return [item.requestedBy?.profile?.firstName, item.requestedBy?.profile?.lastName].filter(Boolean).join(" ") || item.requestedBy?.mobile || item.requestedBy?.email || ""; }
function labelize(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function statusVariant(status: NotificationBroadcastStatus): "default" | "destructive" | "outline" | "secondary" { if (status === "COMPLETED") return "default"; if (status === "FAILED" || status === "CANCELLED") return "destructive"; if (status === "PROCESSING") return "secondary"; return "outline"; }
function HistorySkeleton() { return <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <ShadowSkeleton className="h-20" key={index} />)}</div>; }
function PageSkeleton() { return <div className="space-y-6"><ShadowSkeleton className="h-28" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-24" key={index} />)}</div><ShadowSkeleton className="h-[40rem]" /></div>; }
