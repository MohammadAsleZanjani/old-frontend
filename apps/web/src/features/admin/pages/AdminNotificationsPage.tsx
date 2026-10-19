"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Download,
  Eye,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  Save,
  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import {
  getAdminNotificationLogs,
  getAdminNotifications,
  getAdminNotificationTemplates,
  sendAdminTestNotification,
  upsertAdminNotificationTemplate,
  type AdminNotificationItem,
  type AdminNotificationLogItem,
  type AdminNotificationTemplateItem,
  type NotificationChannel,
  type NotificationPriority,
  type NotificationStatus,
} from "@/features/admin/api/admin-notifications-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminExcelExportButton } from "@/features/admin/components/AdminExcelExportButton";
import { fetchAllAdminExportRows } from "@/features/admin/lib/admin-excel-export";
import { hasAdminPermission } from "@/features/admin/lib/admin-permissions";
import { useI18n, type Lang } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Switch } from "@/shared/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

type NotificationMode = "notifications" | "templates" | "logs";

const channels: NotificationChannel[] = ["IN_APP", "EMAIL", "SMS", "TELEGRAM", "PUSH"];
const priorities: Array<"all" | NotificationPriority> = ["all", "LOW", "NORMAL", "HIGH", "URGENT"];
const statuses: Array<"all" | NotificationStatus> = ["all", "UNREAD", "READ", "ARCHIVED"];

const emptyTemplate = {
  body: "",
  channel: "IN_APP" as NotificationChannel,
  isEnabled: true,
  key: "",
  language: "fa",
  metadataText: "{}",
  subject: "",
};

const emptyTest = {
  body: "",
  channels: ["IN_APP"] as NotificationChannel[],
  event: "admin.test",
  priority: "NORMAL" as NotificationPriority,
  title: "",
  userId: "",
};

export function AdminNotificationsPage({ mode }: { mode: NotificationMode }) {
  const { dir, lang } = useI18n();
  const t = useCallback((value: string) => translateUiText(value, lang), [lang]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("");
  const [channel, setChannel] = useState<"all" | NotificationChannel>("all");
  const [status, setStatus] = useState<"all" | NotificationStatus>("all");
  const [priority, setPriority] = useState<"all" | NotificationPriority>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeliveryColumn, setShowDeliveryColumn] = useState(true);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [testForm, setTestForm] = useState(emptyTest);
  const [activeRecord, setActiveRecord] = useState<AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem | null>(null);
  const queryClient = useQueryClient();
  const overview = useQuery({ queryFn: () => getAdminOverview(), queryKey: ["admin-dashboard-overview"], retry: 1 });
  const access = overview.data?.access;
  const viewPermission: Record<NotificationMode, string> = {
    logs: "notifications.logs.view",
    notifications: "notifications.inbox.view",
    templates: "notifications.templates.view",
  };
  const allowed = hasAdminPermission(access, viewPermission[mode]);
  const canCreate = hasAdminPermission(access, "notifications.inbox.create");
  const canBroadcast = hasAdminPermission(access, "notifications.broadcasts.send");
  const canManageTemplates = hasAdminPermission(access, "notifications.templates.manage");
  const canSendTest = hasAdminPermission(access, "notifications.test.send");
  const query = { channel: channel === "all" ? undefined : channel, event, page, pageSize: 10, priority: priority === "all" ? undefined : priority, search, sortOrder, status: status === "all" ? undefined : status };
  const notifications = useQuery({
    enabled: allowed && mode === "notifications",
    queryFn: () => getAdminNotifications(query),
    queryKey: ["admin-notifications", query],
    retry: 1,
  });
  const templates = useQuery({
    enabled: allowed && mode === "templates",
    queryFn: () => getAdminNotificationTemplates(query),
    queryKey: ["admin-notification-templates", query],
    retry: 1,
  });
  const logs = useQuery({
    enabled: allowed && mode === "logs",
    queryFn: () => getAdminNotificationLogs(query),
    queryKey: ["admin-notification-logs", query],
    retry: 1,
  });
  const activeQuery = mode === "templates" ? templates : mode === "logs" ? logs : notifications;
  const items = useMemo(() => activeQuery.data?.items ?? [], [activeQuery.data?.items]);
  const total = activeQuery.data?.meta?.total ?? activeQuery.data?.total ?? 0;
  const totalPages = activeQuery.data?.meta?.totalPages ?? activeQuery.data?.totalPages ?? 1;
  const metrics = useMemo(() => buildMetrics(mode, items, total, t), [items, mode, total, t]);
  const saveTemplate = useMutation({
    mutationFn: () => upsertAdminNotificationTemplate({
      body: templateForm.body,
      channel: templateForm.channel,
      isEnabled: templateForm.isEnabled,
      key: templateForm.key.trim(),
      language: templateForm.language.trim() || "fa",
      metadata: parseJsonRecord(templateForm.metadataText),
      subject: templateForm.subject,
    }),
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Template save failed")),
    onSuccess: () => {
      toast.success(t("Notification template saved."));
      setTemplateForm(emptyTemplate);
      void queryClient.invalidateQueries({ queryKey: ["admin-notification-templates"] });
    },
  });
  const sendTest = useMutation({
    mutationFn: () => sendAdminTestNotification({
      body: testForm.body,
      channels: testForm.channels,
      event: testForm.event.trim(),
      priority: testForm.priority,
      title: testForm.title,
      userId: testForm.userId.trim(),
    }),
    onError: (error) => toast.error(t(error instanceof Error ? error.message : "Test notification failed")),
    onSuccess: () => {
      toast.success(t("Test notification queued."));
      setTestForm(emptyTest);
      void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-notification-logs"] });
    },
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <NotificationsSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Notifications unavailable")}</AlertTitle>
          <AlertDescription>{t(overview.error.message)}</AlertDescription>
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
            <h2 className="text-2xl font-bold md:text-3xl">{pageTitle(mode, t)}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{pageDescription(mode, lang)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminExcelExportButton
              disabled={activeQuery.isLoading || total === 0}
              fetchRows={() => fetchAllAdminExportRows<unknown>(async (exportPage, pageSize) => {
                const exportQuery = { ...query, page: exportPage, pageSize };
                const result = mode === "templates"
                  ? await getAdminNotificationTemplates(exportQuery)
                  : mode === "logs"
                    ? await getAdminNotificationLogs(exportQuery)
                    : await getAdminNotifications(exportQuery);
                return { items: result.items, totalPages: result.meta?.totalPages ?? result.totalPages };
              })}
              filename={pageTitle(mode, t)}
              sheetName={pageTitle(mode, t)}
            />
            <Button disabled={!selectedRows.length} onClick={() => downloadJson(`${pageTitle(mode, t)} ${t("selected")}`, items.filter((item) => selectedRows.includes(item.id)), t("Export downloaded."))} variant="outline">
              <Download className="size-4" />
              {t("Export selected")}
            </Button>
            {mode === "notifications" ? (
              <>
                {canBroadcast ? <Button asChild variant="outline"><Link href={"/admin/system/operations/broadcasts" as never}><Send className="size-4" />{t("Send to all users")}</Link></Button> : null}
                {canCreate ? <Button asChild><Link href={"/admin/system/operations/create" as never}><Send className="size-4" />{t("Add notification")}</Link></Button> : null}
              </>
            ) : null}
          </div>
        </section>

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

        <Tabs dir={dir} value={mode}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start rtl:[direction:rtl] ltr:[direction:ltr]" dir={dir}>
            {hasAdminPermission(access, "notifications.inbox.view") ? <TabsTrigger asChild value="notifications"><Link href={"/admin/system/operations" as never}>{t("Notifications")}</Link></TabsTrigger> : null}
            {hasAdminPermission(access, "notifications.templates.view") ? <TabsTrigger asChild value="templates"><Link href={"/admin/system/operations/templates" as never}>{t("Notification Templates")}</Link></TabsTrigger> : null}
            {hasAdminPermission(access, "notifications.logs.view") ? <TabsTrigger asChild value="logs"><Link href={"/admin/system/operations/logs" as never}>{t("Delivery logs")}</Link></TabsTrigger> : null}
          </TabsList>
          <TabsContent dir={dir} value={mode}>
            <section className={mode === "notifications" ? "grid gap-4" : "grid gap-4 xl:grid-cols-[1fr_420px]"}>
              <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {mode === "templates" ? <Mail className="size-5 text-primary" /> : mode === "logs" ? <MessageSquare className="size-5 text-primary" /> : <Bell className="size-5 text-primary" />}
                      {pageTitle(mode, t)} {t("registry")}
                    </CardTitle>
                    <Button onClick={() => setShowDeliveryColumn((current) => !current)} size="sm" variant="outline">
                      <SlidersHorizontal className="size-4" />
                      {t("Columns")}
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_150px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="ps-9"
                        onChange={(input) => {
                          setPage(1);
                          setSearch(input.target.value);
                        }}
                        placeholder={t("Search title, event, recipient, or template body")}
                        value={search}
                      />
                    </div>
                    <Select dir={dir} onValueChange={(value) => { setPage(1); setChannel(value as "all" | NotificationChannel); }} value={channel}>
                      <SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("All channels")}</SelectItem>
                        {channels.map((option) => <SelectItem key={option} value={option}>{t(labelize(option))}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select dir={dir} onValueChange={(value) => { setPage(1); setStatus(value as "all" | NotificationStatus); }} value={status}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map((option) => <SelectItem key={option} value={option}>{option === "all" ? t("All statuses") : t(labelize(option))}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select dir={dir} onValueChange={(value: "asc" | "desc") => setSortOrder(value)} value={sortOrder}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">{t("Newest first")}</SelectItem>
                        <SelectItem value="asc">{t("Oldest first")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3 lg:flex-row">
                    <Input
                      onChange={(input) => {
                        setPage(1);
                        setEvent(input.target.value);
                      }}
                      placeholder={t("Filter by event key")}
                      value={event}
                    />
                    <Select dir={dir} onValueChange={(value) => { setPage(1); setPriority(value as "all" | NotificationPriority); }} value={priority}>
                      <SelectTrigger className="lg:w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priorities.map((option) => <SelectItem key={option} value={option}>{option === "all" ? t("All priorities") : t(labelize(option))}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowAdvancedFilters((current) => !current)} variant="outline">{t("Advanced filters")}</Button>
                  </div>
                  {showAdvancedFilters ? (
                    <div className="grid gap-3 rounded-lg border border-border bg-background/35 p-3 text-sm md:grid-cols-4">
                      <FilterSummary label={t("Channel")} value={channel === "all" ? t("All channels") : t(labelize(channel))} />
                      <FilterSummary label={t("Event")} value={event || t("All events")} />
                      <FilterSummary label={t("Priority")} value={priority === "all" ? t("All priorities") : t(labelize(priority))} />
                      <FilterSummary label={t("Selection")} value={`${selectedRows.length} ${t("selected")}`} />
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {activeQuery.isLoading ? <TableSkeleton /> : null}
                  {activeQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertTitle>{t("List unavailable")}</AlertTitle>
                      <AlertDescription>{t(activeQuery.error.message)}</AlertDescription>
                    </Alert>
                  ) : null}
                  {!activeQuery.isLoading && !activeQuery.isError && items.length ? (
                    <NotificationTable
                      canEditTemplate={canManageTemplates}
                      items={items}
                      mode={mode}
                      onEditTemplate={(item) => setTemplateForm(fromTemplate(item))}
                      onSelectRecord={(item) => setActiveRecord(item)}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      showDeliveryColumn={showDeliveryColumn}
                    />
                  ) : null}
                  {!activeQuery.isLoading && !activeQuery.isError && !items.length ? (
                    <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">
                      {t("No notification records match the current filters.")}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">{t("Showing")} {items.length} {t("of")} {total} {t("records")}.</p>
                    <div className="flex gap-2">
                      <Button disabled={page <= 1 || activeQuery.isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline">{t("Previous")}</Button>
                      <Button disabled={page >= totalPages || activeQuery.isLoading} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">{t("Next")}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {mode === "templates" && canManageTemplates ? (
                <TemplateEditor
                  form={templateForm}
                  isPending={saveTemplate.isPending}
                  onChange={setTemplateForm}
                  onSubmit={() => saveTemplate.mutate()}
                />
              ) : mode === "logs" && canSendTest ? (
                <TestNotificationPanel
                  form={testForm}
                  isPending={sendTest.isPending}
                  onChange={setTestForm}
                  onSubmit={() => sendTest.mutate()}
                />
              ) : null}
            </section>
          </TabsContent>
        </Tabs>
      </div>
      <RecordDialog record={activeRecord} onOpenChange={(open) => !open && setActiveRecord(null)} />
    </AdminShell>
  );
}

function NotificationTable(props: {
  canEditTemplate: boolean;
  items: Array<AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem>;
  mode: NotificationMode;
  onEditTemplate: (item: AdminNotificationTemplateItem) => void;
  onSelectRecord: (item: AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem) => void;
  selectedRows: string[];
  setSelectedRows: (rows: string[]) => void;
  showDeliveryColumn: boolean;
}) {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  const isRtl = dir === "rtl";
  const allSelected = props.items.length > 0 && props.items.every((item) => props.selectedRows.includes(item.id));
  return (
    <Table dir={dir}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => props.setSelectedRows(checked ? props.items.map((item) => item.id) : [])}
            />
          </TableHead>
          <TableHead>{props.mode === "templates" ? t("Template") : props.mode === "logs" ? t("Delivery") : t("Notification")}</TableHead>
          <TableHead>{t("Channel / Status")}</TableHead>
          {props.showDeliveryColumn ? <TableHead>{t("Delivery")}</TableHead> : null}
          <TableHead>{t("Updated")}</TableHead>
          <TableHead className="text-start">{t("Actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Checkbox
                checked={props.selectedRows.includes(item.id)}
                onCheckedChange={(checked) => props.setSelectedRows(checked ? [...props.selectedRows, item.id] : props.selectedRows.filter((id) => id !== item.id))}
              />
            </TableCell>
            <TableCell>
              <div className="max-w-xl space-y-1">
                <p className="font-semibold">{primaryTitle(item, t)}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{secondaryTitle(item, t)}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {"channel" in item ? <Badge variant="outline">{t(labelize(item.channel))}</Badge> : null}
                {"status" in item ? <Badge variant={item.status === "FAILED" ? "destructive" : "secondary"}>{t(labelize(item.status))}</Badge> : null}
                {"priority" in item ? <Badge variant="outline">{t(labelize(item.priority))}</Badge> : null}
              </div>
            </TableCell>
            {props.showDeliveryColumn ? <TableCell className="text-sm text-muted-foreground">{deliverySummary(item, t)}</TableCell> : null}
            <TableCell className="text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
            <TableCell className="text-start">
              <div className={cn("flex gap-2", isRtl ? "justify-start" : "justify-end")}>
                {props.mode === "notifications" ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/system/operations/${item.id}` as never}>
                      <Eye className="size-4" />
                      {t("View")}
                    </Link>
                  </Button>
                ) : (
                  <Button onClick={() => props.onSelectRecord(item)} size="sm" variant="outline">
                    <Eye className="size-4" />
                    {t("View")}
                  </Button>
                )}
                {props.canEditTemplate && props.mode === "templates" ? (
                  <Button onClick={() => props.onEditTemplate(item as AdminNotificationTemplateItem)} size="sm" variant="outline">{t("Edit")}</Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TemplateEditor(props: {
  form: typeof emptyTemplate;
  isPending: boolean;
  onChange: (form: typeof emptyTemplate) => void;
  onSubmit: () => void;
}) {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle>{t("Template editor")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Label className="space-y-2">
            <span>{t("Event key")}</span>
            <Input onChange={(event) => props.onChange({ ...props.form, key: event.target.value })} value={props.form.key} />
          </Label>
          <Label className="space-y-2">
            <span>{t("Language")}</span>
            <Input onChange={(event) => props.onChange({ ...props.form, language: event.target.value })} value={props.form.language} />
          </Label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Select dir={dir} onValueChange={(value) => props.onChange({ ...props.form, channel: value as NotificationChannel })} value={props.form.channel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{channels.map((option) => <SelectItem key={option} value={option}>{t(labelize(option))}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/35 p-3">
            <span className="text-sm font-medium">{t("Enabled")}</span>
            <Switch checked={props.form.isEnabled} onCheckedChange={(checked) => props.onChange({ ...props.form, isEnabled: checked })} />
          </div>
        </div>
        <Label className="space-y-2">
          <span>{t("Subject")}</span>
          <Input onChange={(event) => props.onChange({ ...props.form, subject: event.target.value })} value={props.form.subject} />
        </Label>
        <Label className="space-y-2">
          <span>{t("Body")}</span>
          <Textarea className="min-h-40" onChange={(event) => props.onChange({ ...props.form, body: event.target.value })} value={props.form.body} />
        </Label>
        <Label className="space-y-2">
          <span>{t("Metadata JSON")}</span>
          <Textarea className="min-h-28 font-mono text-xs" onChange={(event) => props.onChange({ ...props.form, metadataText: event.target.value })} value={props.form.metadataText} />
        </Label>
        <Button
          className="w-full"
          disabled={props.isPending || !props.form.key.trim() || !props.form.subject.trim() || !props.form.body.trim() || !isValidJson(props.form.metadataText)}
          onClick={props.onSubmit}
        >
          {props.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("Save template")}
        </Button>
      </CardContent>
    </Card>
  );
}

function TestNotificationPanel(props: {
  form: typeof emptyTest;
  isPending: boolean;
  onChange: (form: typeof emptyTest) => void;
  onSubmit: () => void;
}) {
  const { dir, lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle>{t("Send test notification")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label className="space-y-2">
          <span>{t("User ID")}</span>
          <Input onChange={(event) => props.onChange({ ...props.form, userId: event.target.value })} value={props.form.userId} />
        </Label>
        <div className="grid gap-3 md:grid-cols-2">
          <Label className="space-y-2">
            <span>{t("Event")}</span>
            <Input onChange={(event) => props.onChange({ ...props.form, event: event.target.value })} value={props.form.event} />
          </Label>
          <Select dir={dir} onValueChange={(value) => props.onChange({ ...props.form, priority: value as NotificationPriority })} value={props.form.priority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{priorities.filter((item) => item !== "all").map((option) => <SelectItem key={option} value={option}>{t(labelize(option))}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Label className="space-y-2">
          <span>{t("Title")}</span>
          <Input onChange={(event) => props.onChange({ ...props.form, title: event.target.value })} value={props.form.title} />
        </Label>
        <Label className="space-y-2">
          <span>{t("Body")}</span>
          <Textarea className="min-h-32" onChange={(event) => props.onChange({ ...props.form, body: event.target.value })} value={props.form.body} />
        </Label>
        <div className="grid gap-2 rounded-lg border border-border bg-background/35 p-3">
          <p className="text-sm font-medium">{t("Channels")}</p>
          {channels.map((option) => (
            <label className="flex items-center gap-2 text-sm" key={option}>
              <Checkbox
                checked={props.form.channels.includes(option)}
                onCheckedChange={(checked) => props.onChange({
                  ...props.form,
                  channels: checked ? [...props.form.channels, option] : props.form.channels.filter((item) => item !== option),
                })}
              />
              {t(labelize(option))}
            </label>
          ))}
        </div>
        <Button
          className="w-full"
          disabled={props.isPending || !props.form.userId.trim() || !props.form.event.trim() || !props.form.title.trim() || !props.form.body.trim() || !props.form.channels.length}
          onClick={props.onSubmit}
        >
          {props.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {t("Send test")}
        </Button>
      </CardContent>
    </Card>
  );
}

function RecordDialog(props: {
  onOpenChange: (open: boolean) => void;
  record: AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem | null;
}) {
  const { lang } = useI18n();
  const t = (value: string) => translateUiText(value, lang);
  return (
    <Dialog onOpenChange={props.onOpenChange} open={!!props.record}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{props.record ? primaryTitle(props.record, t) : t("Record")}</DialogTitle>
          <DialogDescription>{t("Complete notification details for review and support follow-up.")}</DialogDescription>
        </DialogHeader>
        <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-6">
          {JSON.stringify(props.record, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}

function FilterSummary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-muted-foreground">{value}</p>
    </div>
  );
}

function buildMetrics(mode: NotificationMode, items: Array<AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem>, total: number, t: (value: string) => string) {
  const failed = items.filter((item) => "status" in item && item.status === "FAILED").length;
  const queued = items.filter((item) => "status" in item && ["PENDING", "QUEUED", "UNREAD"].includes(item.status)).length;
  const enabled = items.filter((item) => "isEnabled" in item && item.isEnabled).length;
  return [
    { label: t("Total"), meta: `${pageTitle(mode, t)} ${t("in current scope")}`, value: total },
    { label: mode === "templates" ? t("Enabled") : t("Queued"), meta: mode === "templates" ? t("Active templates on page") : t("Pending work on page"), value: mode === "templates" ? enabled : queued },
    { label: t("Channels"), meta: t("Distinct channels on page"), value: new Set(items.filter((item) => "channel" in item).map((item) => item.channel)).size },
    { label: t("Failed"), meta: t("Failed deliveries on page"), value: failed },
  ];
}

function fromTemplate(item: AdminNotificationTemplateItem) {
  return {
    body: item.body,
    channel: item.channel,
    isEnabled: item.isEnabled,
    key: item.key,
    language: item.language,
    metadataText: JSON.stringify(item.metadata ?? {}, null, 2),
    subject: item.subject,
  };
}

function primaryTitle(item: AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem, t: (value: string) => string) {
  if ("title" in item && typeof item.title === "string") return item.title;
  if ("subject" in item && typeof item.subject === "string") return item.subject;
  if ("event" in item && typeof item.event === "string") return t(item.event);
  return item.id;
}

function secondaryTitle(item: AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem, t: (value: string) => string) {
  if ("body" in item && typeof item.body === "string") return item.body;
  if ("recipient" in item) return item.recipient ? `${t(item.event)} — ${t("Recipient")}: ${item.recipient}` : t(item.event);
  if ("key" in item && typeof item.key === "string") return item.key;
  return item.id;
}

function deliverySummary(item: AdminNotificationItem | AdminNotificationLogItem | AdminNotificationTemplateItem, t: (value: string) => string) {
  if ("logs" in item) return `${item.logs?.length ?? 0} ${t("delivery logs")}`;
  if ("attempts" in item) return `${item.attempts} ${t(item.attempts === 1 ? "attempt" : "attempts")}${item.provider ? ` ${t("via")} ${t(labelize(item.provider))}` : ""}`;
  if ("language" in item) return item.language;
  return t("n/a");
}

function pageTitle(mode: NotificationMode, t: (value: string) => string) {
  if (mode === "templates") return t("Notification Templates");
  if (mode === "logs") return t("Notification Logs");
  return t("Notifications");
}

function pageDescription(mode: NotificationMode, lang: Lang) {
  const descriptions = {
    logs: {
      ar: "دقق محاولات تسليم الإشعارات والمهام المنتظرة ومراجع المزود وإعادات المحاولة والمستلمين وعمليات التسليم الفاشلة.",
      en: "Audit notification delivery attempts, queued jobs, provider references, retries, recipients, and failed deliveries.",
      fa: "تلاش‌های ارسال اعلان، کارهای صف‌شده، ارجاع‌های ارائه‌دهنده، تلاش‌های مجدد، گیرندگان و ارسال‌های ناموفق را بازرسی کنید.",
    },
    notifications: {
      ar: "افحص أحداث الإشعارات التشغيلية وأرسل إشعارات اختبار واعية بالصلاحيات وصدّر بيانات التنبيهات لسير عمل الدعم.",
      en: "Review account notifications, send a test message when needed, and export results for support follow-up.",
      fa: "اعلان‌های حساب را بررسی کنید، در صورت نیاز پیام آزمایشی بفرستید و نتیجه را برای پیگیری پشتیبانی خروجی بگیرید.",
    },
    templates: {
      ar: "أدر قوالب الإشعارات القابلة لإعادة الاستخدام للبريد وSMS وتلغرام والدفع وداخل التطبيق بمحتوى واع للغة.",
      en: "Manage reusable email, SMS, Telegram, push, and in-app notification templates with language-aware content.",
      fa: "قالب‌های قابل استفاده مجدد ایمیل، پیامک، تلگرام، پوش و اعلان درون‌برنامه‌ای را با محتوای وابسته به زبان مدیریت کنید.",
    },
  } satisfies Record<NotificationMode, Record<"ar" | "en" | "fa", string>>;
  return descriptions[mode][lang as "ar" | "en" | "fa"] ?? descriptions[mode].fa;
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

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function downloadJson(label: string, items: unknown[], successMessage = "Export downloaded.") {
  if (typeof window === "undefined" || !items.length) return;
  const filename = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "notifications"}.json`;
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success(successMessage);
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => <ShadowSkeleton className="h-12" key={index} />)}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <ShadowSkeleton className="h-28" key={index} />)}
      </div>
      <ShadowSkeleton className="h-[40rem]" />
    </div>
  );
}
