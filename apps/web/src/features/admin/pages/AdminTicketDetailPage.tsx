"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Download, FileText, Loader2, MessageSquareText, NotebookText, ReceiptText, Send, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { formatPlatformDate } from "@/shared/lib/date-format";
import { formatMobileDisplay } from "@/shared/lib/date-format";
import {
  addTicketInternalNote,
  getAdminTicketAttachmentSignedUrl,
  getAdminTicket,
  staffReplyToTicket,
  toTicketAttachmentInput,
  updateTicketPriority,
  updateTicketStatus,
  type AdminTicketDetail,
  type SupportUserSummary,
  type TicketPriority,
  type TicketStatus,
} from "@/domains/support/support-api";
import { TicketAttachmentField } from "@/domains/support/TicketAttachmentField";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Textarea } from "@/shared/ui/textarea";
import type { UploadApiResult } from "@/shared/uploads/upload-api";

const ticketStatuses: TicketStatus[] = ["OPEN", "PENDING", "WAITING_ON_CUSTOMER", "WAITING_ON_STAFF", "RESOLVED", "CLOSED"];
const ticketPriorities: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function AdminTicketDetailPage({ ticketId }: { ticketId: string }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const access = overview.data?.access;
  const canView = !!access && (access.isSuperAdmin || access.permissions.includes("tickets.view"));
  const ticket = useQuery({
    enabled: canView,
    queryFn: () => getAdminTicket(ticketId),
    queryKey: ["admin-ticket-detail", ticketId],
    retry: 1,
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <TicketDetailSkeleton />
      </AdminShell>
    );
  }

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

  if (!canView) {
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
            <Badge className="w-fit" variant="outline">{t("Support / Tickets")}</Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{ticket.data?.ticketNumber ?? t("Ticket detail")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("Review the customer conversation, reply from staff, add internal notes, change priority or status, and inspect related commercial records.")}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/admin/support/tickets" as never}>
              <ArrowRight className="size-4" />
              {t("Back to tickets")}
            </Link>
          </Button>
        </section>

        {ticket.isLoading ? <TicketDetailSkeleton /> : null}

        {ticket.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Ticket unavailable")}</AlertTitle>
            <AlertDescription>{ticket.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {ticket.data ? <TicketDetail access={access} ticket={ticket.data} ticketId={ticketId} /> : null}
      </div>
    </AdminShell>
  );
}

function TicketDetail({ access, ticket, ticketId }: { access: { isSuperAdmin: boolean; permissions: string[] } | undefined; ticket: AdminTicketDetail; ticketId: string }) {
  const { dir, lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<UploadApiResult[]>([]);
  const [uploadingReplyAttachments, setUploadingReplyAttachments] = useState(false);
  const [note, setNote] = useState("");
  const canReply = !!access && (access.isSuperAdmin || access.permissions.includes("tickets.reply"));
  const canManage = !!access && (access.isSuperAdmin || access.permissions.includes("tickets.assign") || access.permissions.includes("tickets.reply"));

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-ticket-detail", ticketId] });
    void queryClient.invalidateQueries({ queryKey: ["admin-resource", "/admin/support/tickets"] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => updateTicketStatus(ticketId, status),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Status update failed")),
    onSuccess: () => {
      toast.success(t("Ticket status updated."));
      invalidate();
    },
  });
  const priorityMutation = useMutation({
    mutationFn: (priority: TicketPriority) => updateTicketPriority(ticketId, priority),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Priority update failed")),
    onSuccess: () => {
      toast.success(t("Ticket priority updated."));
      invalidate();
    },
  });
  const replyMutation = useMutation({
    mutationFn: () => staffReplyToTicket(ticketId, { attachments: replyAttachments.map(toTicketAttachmentInput), body: reply.trim() }),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Reply failed")),
    onSuccess: () => {
      setReply("");
      setReplyAttachments([]);
      toast.success(t("Reply added."));
      invalidate();
    },
  });
  const noteMutation = useMutation({
    mutationFn: () => addTicketInternalNote(ticketId, note.trim()),
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Internal note failed")),
    onSuccess: () => {
      setNote("");
      toast.success(t("Internal note added."));
      invalidate();
    },
  });
  const downloadAttachment = async (attachmentId: string) => {
    try {
      const signed = await getAdminTicketAttachmentSignedUrl(ticketId, attachmentId);
      window.open(resolveApiUrl(signed.url), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Attachment download failed"));
    }
  };

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Status")} value={t(formatLabel(ticket.status))} />
        <MetricCard label={t("Priority")} value={t(formatLabel(ticket.priority))} />
        <MetricCard label={t("Messages")} value={String(ticket.messages.length)} />
        <MetricCard label={t("Last reply")} value={ticket.lastReplyAt ? formatDate(ticket.lastReplyAt) : t("No reply")} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="size-5 text-primary" />
                {t("Conversation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-background/35 p-4">
                <p className="text-sm text-muted-foreground">{t("Subject")}</p>
                <p className="mt-1 font-semibold">{ticket.subject}</p>
              </div>
              {ticket.messages.length ? (
                ticket.messages.map((message) => (
                  <TimelineCard
                    attachments={message.attachments}
                    key={message.id}
                    body={message.body}
                    meta={<><AdminUserLink userId={message.author?.id}>{displayUser(message.author)}</AdminUserLink> · {formatDate(message.createdAt)} · {formatLabel(message.visibility)}</>}
                    onDownloadAttachment={downloadAttachment}
                    title={message.author?.id === ticket.customer?.id ? t("Customer message") : t("Staff reply")}
                  />
                ))
              ) : (
                <EmptyBox label={t("No customer conversation has been recorded.")} />
              )}
              <div className="space-y-3 rounded-lg border border-border bg-background/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{t("Staff reply")}</p>
                  <Badge variant="outline">{canReply ? t("Enabled") : t("Permission required")}</Badge>
                </div>
                <Textarea
                  disabled={!canReply || replyMutation.isPending}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder={t("Write a clear customer-facing reply")}
                  value={reply}
                />
                <TicketAttachmentField disabled={!canReply || replyMutation.isPending} entityId={ticketId} onChange={setReplyAttachments} onUploadingChange={setUploadingReplyAttachments} value={replyAttachments} />
                <Button disabled={!canReply || (!reply.trim() && !replyAttachments.length) || replyMutation.isPending || uploadingReplyAttachments} onClick={() => replyMutation.mutate()}>
                  {replyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {t("Send reply")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookText className="size-5 text-primary" />
                {t("Internal notes")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.internalNotes.length ? (
                ticket.internalNotes.map((internalNote) => (
                  <TimelineCard
                    key={internalNote.id}
                    body={internalNote.body}
                    meta={<><AdminUserLink userId={internalNote.author?.id}>{displayUser(internalNote.author)}</AdminUserLink> · {formatDate(internalNote.createdAt)}</>}
                    title={t("Private note")}
                  />
                ))
              ) : (
                <EmptyBox label={t("No internal notes have been added.")} />
              )}
              <div className="space-y-3 rounded-lg border border-border bg-background/35 p-4">
                <Textarea
                  disabled={!canReply || noteMutation.isPending}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t("Add a private staff note")}
                  value={note}
                />
                <Button disabled={!canReply || !note.trim() || noteMutation.isPending} onClick={() => noteMutation.mutate()} variant="outline">
                  {noteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <NotebookText className="size-4" />}
                  {t("Add note")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle>{t("Ticket controls")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select dir={dir} disabled={!canManage || statusMutation.isPending} onValueChange={(value) => statusMutation.mutate(value as TicketStatus)} value={ticket.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{t(formatLabel(status))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select dir={dir} disabled={!canManage || priorityMutation.isPending} onValueChange={(value) => priorityMutation.mutate(value as TicketPriority)} value={ticket.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketPriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>{t(formatLabel(priority))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <ProfileCard ticket={ticket} />
          <RelatedRecords ticket={ticket} />
          <AuditHistory ticket={ticket} />
        </div>
      </section>
    </>
  );
}

function ProfileCard({ ticket }: { ticket: AdminTicketDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5 text-primary" />
          {t("Customer")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <AmountRow label={t("Name")} value={<AdminUserLink userId={ticket.customer?.id}>{displayUser(ticket.customer)}</AdminUserLink>} />
        <AmountRow label={t("Email")} value={ticket.customer?.email ?? t("No email")} />
        <AmountRow label={t("Mobile")} value={formatMobileDisplay(ticket.customer?.mobile) || t("No mobile")} />
        <AmountRow label={t("Department")} value={ticket.department?.name ?? t("Unassigned")} />
        <AmountRow label={t("Assigned")} value={<AdminUserLink userId={ticket.assignedTo?.id}>{displayUser(ticket.assignedTo)}</AdminUserLink>} />
        <AmountRow label={t("Created")} value={formatDate(ticket.createdAt)} />
      </CardContent>
    </Card>
  );
}

function RelatedRecords({ ticket }: { ticket: AdminTicketDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle>{t("Related records")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ticket.relatedOrder ? (
          <RecordLink
            href={`/admin/shop/orders/${ticket.relatedOrder.id}`}
            icon={<ReceiptText className="size-4 text-primary" />}
            meta={`${t(ticket.relatedOrder.status)} · ${ticket.relatedOrder.total}`}
            title={ticket.relatedOrder.orderNumber}
          />
        ) : null}
        {ticket.relatedInvoice ? (
          <RecordLink
            href={`/admin/finance/invoices/${ticket.relatedInvoice.id}`}
            icon={<FileText className="size-4 text-primary" />}
            meta={`${t(ticket.relatedInvoice.status)} · ${ticket.relatedInvoice.total}`}
            title={ticket.relatedInvoice.invoiceNumber}
          />
        ) : null}
        {!ticket.relatedOrder && !ticket.relatedInvoice ? <EmptyBox label={t("No order or invoice is linked.")} /> : null}
      </CardContent>
    </Card>
  );
}

function AuditHistory({ ticket }: { ticket: AdminTicketDetail }) {
  const { lang } = useI18n();
  const t = (text: string) => translateUiText(text, lang);
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle>{t("Audit history")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ticket.history.length ? (
          ticket.history.map((event) => (
            <div className="rounded-lg border border-border bg-background/35 p-3" key={event.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{t(formatLabel(event.type))}</p>
                <Badge variant="outline">{formatDate(event.createdAt)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <AdminUserLink className="text-xs" userId={event.actor?.id}>{displayUser(event.actor)}</AdminUserLink>
                {event.fromValue || event.toValue
                  ? ` · ${t(`Changed from ${event.fromValue ?? t("empty")} to ${event.toValue ?? t("empty")}`)}`
                  : ""}
              </p>
            </div>
          ))
        ) : (
          <EmptyBox label={t("No audit events have been recorded.")} />
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="truncate text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function AmountRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background/35 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-semibold">{value}</span>
    </div>
  );
}

function RecordLink({ href, icon, meta, title }: { href: string; icon: ReactNode; meta: string; title: string }) {
  return (
    <Link className="flex items-center gap-3 rounded-lg border border-border bg-background/35 p-3 hover:border-primary/50" href={href as never}>
      {icon}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{meta}</span>
      </span>
    </Link>
  );
}

function TimelineCard({ attachments = [], body, meta, onDownloadAttachment, title }: { attachments?: AdminTicketDetail["messages"][number]["attachments"]; body: string; meta: ReactNode; onDownloadAttachment?: (attachmentId: string) => void; title: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/35 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{body}</p>
      {attachments.length && onDownloadAttachment ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <Button key={attachment.id} onClick={() => onDownloadAttachment(attachment.id)} size="sm" type="button" variant="outline">
              <Download className="size-4" />
              {attachment.fileName}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function resolveApiUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";
  return new URL(value, apiBase).toString();
}

function EmptyBox({ label }: { label: string }) {
  return (
    <div className="grid min-h-28 place-items-center rounded-lg border border-dashed border-border bg-background/30 px-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <ShadowSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ShadowSkeleton className="h-28" key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ShadowSkeleton className="h-[42rem]" />
        <div className="space-y-4">
          <ShadowSkeleton className="h-44" />
          <ShadowSkeleton className="h-64" />
          <ShadowSkeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

function displayUser(user?: SupportUserSummary | null) {
  const profileName = [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(" ");
  return profileName || user?.email || "Unassigned";
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
