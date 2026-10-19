"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCheck, Download, Loader2, MessageCircle, Paperclip, Send, ShieldCheck, UsersRound, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/shared/ui/sonner";

import { getAdminOverview } from "@/features/admin/api/admin-dashboard-api";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminUserLink } from "@/features/admin/components/AdminUserLink";
import { formatPlatformDate } from "@/shared/lib/date-format";
import {
  closeLiveChat,
  createLiveChatSocket,
  getAdminLiveChat,
  getLiveChatAttachmentSignedUrl,
  joinLiveChatConversation,
  markLiveChatRead,
  markLiveChatSocketRead,
  mergeLiveChatMessage,
  sendAdminLiveChatMessage,
  sendLiveChatTyping,
  type AdminLiveChatDetail,
  type LiveChatConversationEvent,
  type LiveChatMessageEvent,
  type LiveChatPresenceEvent,
  type LiveChatReadEvent,
  type LiveChatTypingEvent,
  type LiveChatUserSummary,
} from "@/domains/live-chat/live-chat-api";
import { useI18n } from "@/shared/i18n";
import { translateUiText } from "@/shared/i18n/ui-copy";
import { uploadFile, type UploadApiResult } from "@/shared/uploads/upload-api";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ShadowSkeleton } from "@/shared/ui/skeleton-state";
import { Textarea } from "@/shared/ui/textarea";

function T({ children }: { children: string }) {
  const { lang } = useI18n();
  return <>{translateUiText(children, lang)}</>;
}

function useAdminT() {
  const { lang } = useI18n();
  return useCallback((text: string) => translateUiText(text, lang), [lang]);
}

export function AdminLiveChatDetailPage({ conversationId }: { conversationId: string }) {
  const t = useAdminT();
  const overview = useQuery({
    queryFn: () => getAdminOverview(),
    queryKey: ["admin-dashboard-overview"],
    retry: 1,
  });
  const access = overview.data?.access;
  const canAccess = !!access && (access.isSuperAdmin || access.permissions.includes("live_chat.access"));
  const conversation = useQuery({
    enabled: canAccess,
    queryFn: () => getAdminLiveChat(conversationId),
    queryKey: ["admin-live-chat-detail", conversationId],
    refetchInterval: 4_000,
    retry: 1,
  });

  if (overview.isLoading) {
    return (
      <AdminShell>
        <LiveChatSkeleton />
      </AdminShell>
    );
  }

  if (overview.isError) {
    return (
      <AdminShell>
        <Alert variant="destructive">
          <AlertTitle>{t("Admin page unavailable")}</AlertTitle>
          <AlertDescription>{t(overview.error.message)}</AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  if (!canAccess) {
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
            <Badge className="w-fit" variant="outline"><T>Support / Live Chat</T></Badge>
            <h2 className="text-2xl font-bold md:text-3xl">{conversation.data?.conversationNo ?? t("Live chat detail")}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              <T>Handle active chat requests, inspect participants, reply as support, mark messages read, and close conversations with audit context.</T>
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/admin/support/live-chat" as never}>
              <ArrowRight className="size-4" />
              <T>Back to live chat</T>
            </Link>
          </Button>
        </section>

        {conversation.isLoading ? <LiveChatSkeleton /> : null}

        {conversation.isError ? (
          <Alert variant="destructive">
            <AlertTitle><T>Conversation unavailable</T></AlertTitle>
            <AlertDescription>{conversation.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {conversation.data ? <LiveChatDetail conversation={conversation.data} conversationId={conversationId} /> : null}
      </div>
    </AdminShell>
  );
}

function LiveChatDetail({ conversation, conversationId }: { conversation: AdminLiveChatDetail; conversationId: string }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState<UploadApiResult[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<LiveChatTypingEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<ReturnType<typeof createLiveChatSocket> | null>(null);
  const joinedRef = useRef(false);
  const t = useAdminT();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-live-chat-detail", conversationId] });
    void queryClient.invalidateQueries({ queryKey: ["admin-resource", "/admin/live-chat/conversations"] });
  };

  const replyMutation = useMutation({
    mutationFn: async () => {
      const body = reply.trim();
      const message = {
        attachments: attachments.map((attachment) => ({
          fileName: attachment.originalName || attachment.fileName,
          mimeType: attachment.mimeType,
          sizeBytes: Number(attachment.sizeBytes),
          uploadId: attachment.id,
        })),
        body,
      };
      return sendAdminLiveChatMessage(conversationId, message);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Message failed")),
    onSuccess: () => {
      setReply("");
      setAttachments([]);
      toast.success(t("Message sent."));
      invalidate();
    },
  });
  const readMutation = useMutation({
    mutationFn: async () => {
      if (socketRef.current?.connected && joinedRef.current) {
        markLiveChatSocketRead(socketRef.current, { conversationId, role: "AGENT" });
        return { read: 0 };
      }
      return markLiveChatRead(conversationId);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Read receipt update failed")),
    onSuccess: () => {
      toast.success(t("Conversation marked read."));
      invalidate();
    },
  });
  const closeMutation = useMutation({
    mutationFn: async () => {
      const reason = closeReason.trim() || undefined;
      return closeLiveChat(conversationId, reason);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("Conversation close failed")),
    onSuccess: () => {
      setCloseReason("");
      toast.success(t("Conversation closed."));
      invalidate();
    },
  });

  const closed = conversation.status === "CLOSED";

  const uploadAttachments = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    setUploadingAttachment(true);
    try {
      const uploads = await Promise.all(
        selected.slice(0, 4).map((file) => uploadFile({ entityId: conversationId, entityType: "live-chat", file, visibility: "PRIVATE" })),
      );
      setAttachments((current) => [...uploads, ...current]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Attachment upload failed"));
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const socket = createLiveChatSocket();
    socketRef.current = socket;
    joinedRef.current = false;

    const patchConversation = (updater: (current: AdminLiveChatDetail) => AdminLiveChatDetail) => {
      queryClient.setQueryData<AdminLiveChatDetail>(["admin-live-chat-detail", conversationId], (current) => (current ? updater(current) : current));
    };

    socket.on("connect", () => {
      joinedRef.current = false;
      setConnected(false);
      joinLiveChatConversation(socket, { conversationId, role: "AGENT" });
      joinedRef.current = true;
      setConnected(true);
      markLiveChatSocketRead(socket, { conversationId, role: "AGENT" });
    });
    socket.on("disconnect", () => {
      joinedRef.current = false;
      setConnected(false);
    });
    socket.on("connect_error", () => {
      joinedRef.current = false;
      setConnected(false);
    });
    socket.on("message:new", (event: LiveChatMessageEvent) => {
      if (event.conversationId !== conversationId) return;
      patchConversation((current) => mergeLiveChatMessage(current, event.message));
      void queryClient.invalidateQueries({ queryKey: ["admin-resource", "/admin/live-chat/conversations"] });
      if (event.message.role !== "AGENT") markLiveChatSocketRead(socket, { conversationId, role: "AGENT" });
    });
    socket.on("presence", (event: LiveChatPresenceEvent) => {
      if (event.conversationId !== conversationId) return;
      const now = new Date().toISOString();
      patchConversation((current) => ({
        ...current,
        participants: current.participants.map((participant) =>
          participant.userId === event.userId && participant.role === event.role ? { ...participant, isOnline: event.online, lastSeenAt: now, leftAt: event.online ? null : now } : participant,
        ),
      }));
    });
    socket.on("typing", (event: LiveChatTypingEvent) => {
      if (event.conversationId !== conversationId || event.role === "AGENT") return;
      setTyping(event.isTyping ? event : null);
    });
    socket.on("messages:read", (event: LiveChatReadEvent) => {
      if (event.conversationId === conversationId) void queryClient.invalidateQueries({ queryKey: ["admin-live-chat-detail", conversationId] });
    });
    socket.on("conversation:closed", (event: LiveChatConversationEvent) => {
      if (event.conversationId !== conversationId) return;
      patchConversation((current) => ({ ...current, ...event.conversation, status: "CLOSED" }));
    });
    socket.on("conversation:assigned", (event: LiveChatConversationEvent) => {
      if (event.conversationId === conversationId) void queryClient.invalidateQueries({ queryKey: ["admin-live-chat-detail", conversationId] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      joinedRef.current = false;
      setConnected(false);
    };
  }, [conversationId, queryClient, t]);

  useEffect(() => {
    if (!socketRef.current?.connected || !joinedRef.current || closed) return;
    sendLiveChatTyping(socketRef.current, { conversationId, isTyping: Boolean(reply.trim()), role: "AGENT" });
    const timeout = window.setTimeout(() => {
      if (socketRef.current?.connected && joinedRef.current) sendLiveChatTyping(socketRef.current, { conversationId, isTyping: false, role: "AGENT" });
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [closed, conversationId, reply]);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Status")} value={t(formatLabel(conversation.status))} />
        <MetricCard label={t("Messages")} value={String(conversation.messages.length)} />
        <MetricCard label={t("Participants")} value={String(conversation.participants.length)} />
        <MetricCard label={t("Last message")} value={conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : t("No message")} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-5 text-primary" />
                <T>Message timeline</T>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-background/35 p-4">
                <p className="text-sm text-muted-foreground"><T>Subject</T></p>
                <p className="mt-1 font-semibold">{conversation.subject || t("Live support conversation")}</p>
              </div>
              <div className="max-h-[32rem] space-y-3 overflow-y-auto rounded-xl border border-border bg-background/25 p-4">
                {conversation.messages.length ? (
                  conversation.messages.map((message) => (
                    <TimelineMessage
                      attachments={message.attachments}
                      body={message.body || t("Attachment message")}
                      conversationId={conversationId}
                      key={message.id}
                      meta={<><AdminUserLink className="text-xs" userId={message.sender?.id}>{displayUser(message.sender) || t(formatLabel(message.role))}</AdminUserLink> · {formatDate(message.createdAt)} · {t(formatLabel(message.status))} · {message.readReceipts.length} {t("read")}</>}
                      role={message.role}
                    />
                  ))
                ) : (
                  <EmptyBox label={t("No messages have been sent yet.")} />
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-background/35 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold"><T>Agent reply</T></p>
                  <div className="flex gap-2">
                    <Button disabled={readMutation.isPending} onClick={() => readMutation.mutate()} size="sm" variant="outline">
                      {readMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
                      <T>Mark read</T>
                    </Button>
                    <Badge variant="outline">{connected ? <T>Live</T> : <T>Offline</T>}</Badge>
                    <Badge variant="outline">{closed ? <T>Closed</T> : <T>Open</T>}</Badge>
                  </div>
                </div>
                {typing?.isTyping ? <p className="text-xs text-muted-foreground"><T>Customer is typing...</T></p> : null}
                {closed ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                    <T>This conversation has been closed. The customer can review the history, but replies are disabled.</T>
                  </div>
                ) : null}
                <Textarea
                  disabled={closed || replyMutation.isPending}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder={closed ? t("This conversation is closed") : t("Write a support message")}
                  value={reply}
                />
                {attachments.length ? (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <Badge className="gap-2" key={attachment.id} variant="secondary">
                        <Paperclip className="size-3" />
                        {attachment.originalName || attachment.fileName}
                        <button aria-label={`Remove ${attachment.originalName || attachment.fileName}`} onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))} type="button">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <input className="hidden" multiple onChange={(event) => uploadAttachments(event.target.files)} ref={fileInputRef} type="file" />
                  <Button disabled={closed || uploadingAttachment || replyMutation.isPending} onClick={() => fileInputRef.current?.click()} size="icon" type="button" variant="outline" aria-label={t("Attach file")}>
                    {uploadingAttachment ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                  </Button>
                  <Button className="min-w-36" disabled={closed || (!reply.trim() && !attachments.length) || replyMutation.isPending || uploadingAttachment} onClick={() => replyMutation.mutate()}>
                    {replyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    <T>Send message</T>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <T>Event history</T>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {conversation.events.length ? (
                conversation.events.map((event) => (
                  <div className="rounded-lg border border-border bg-background/35 p-3" key={event.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{t(formatLabel(event.type))}</p>
                      <Badge variant="outline">{formatDate(event.createdAt)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{event.actorId ? `${t("Actor")} ${event.actorId}` : t("System event")}</p>
                  </div>
                ))
              ) : (
                <EmptyBox label={t("No events have been recorded.")} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
            <CardHeader>
              <CardTitle><T>Close conversation</T></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                disabled={closed || closeMutation.isPending}
                onChange={(event) => setCloseReason(event.target.value)}
                placeholder={t("Optional close reason")}
                value={closeReason}
              />
              <Button disabled={closed || closeMutation.isPending} onClick={() => closeMutation.mutate()} variant="outline">
                {closeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                <T>Close chat</T>
              </Button>
            </CardContent>
          </Card>

          <ParticipantCard conversation={conversation} />
          <CustomerCard conversation={conversation} />
        </div>
      </section>
    </>
  );
}

function ParticipantCard({ conversation }: { conversation: AdminLiveChatDetail }) {
  const t = useAdminT();
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound className="size-5 text-primary" />
          <T>Participants</T>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {conversation.participants.length ? (
          conversation.participants.map((participant) => (
            <div className="rounded-lg border border-border bg-background/35 p-3" key={participant.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold"><AdminUserLink userId={participant.userId}>{participant.displayName || t(formatLabel(participant.role))}</AdminUserLink></p>
                <Badge variant={participant.isOnline ? "default" : "outline"}>{participant.isOnline ? <T>Online</T> : <T>Offline</T>}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t(formatLabel(participant.role))} · <T>last seen</T> {participant.lastSeenAt ? formatDate(participant.lastSeenAt) : <T>unknown</T>}</p>
            </div>
          ))
        ) : (
          <EmptyBox label={t("No participants have joined.")} />
        )}
      </CardContent>
    </Card>
  );
}

function CustomerCard({ conversation }: { conversation: AdminLiveChatDetail }) {
  const t = useAdminT();
  return (
    <Card className="rounded-lg border-border bg-card/70 shadow-[0_22px_60px_-40px_var(--glow)]">
      <CardHeader>
        <CardTitle><T>Customer profile</T></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <AmountRow label={t("Name")} value={<AdminUserLink userId={conversation.customer?.id}>{displayUser(conversation.customer) || conversation.visitorName || t("Visitor")}</AdminUserLink>} />
        <AmountRow label={t("Email")} value={conversation.customer?.email ?? conversation.visitorEmail ?? t("No email")} />
        <AmountRow label={t("Mobile")} value={conversation.customer?.mobile ?? t("Not provided")} />
        <AmountRow label={t("Agent")} value={<AdminUserLink userId={conversation.assignedAgent?.id}>{displayUser(conversation.assignedAgent) || t("Unassigned")}</AdminUserLink>} />
        <AmountRow label={t("Started")} value={formatDate(conversation.startedAt)} />
        <AmountRow label={t("IP")} value={conversation.ipAddress ?? t("Not captured")} />
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

function TimelineMessage({
  attachments,
  body,
  conversationId,
  meta,
  role,
}: {
  attachments: AdminLiveChatDetail["messages"][number]["attachments"];
  body: string;
  conversationId: string;
  meta: ReactNode;
  role: string;
}) {
  const agent = role === "AGENT";
  const t = useAdminT();
  const downloadAttachment = async (attachmentId: string) => {
    try {
      const signed = await getLiveChatAttachmentSignedUrl(conversationId, attachmentId, { admin: true });
      window.open(resolveApiUrl(signed.url), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Attachment download failed"));
    }
  };
  return (
    <div className={agent ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[84%] rounded-2xl border p-4 shadow-[0_18px_50px_-42px_var(--glow)] ${agent ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-card/90"}`}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{agent ? t("Agent message") : t("Customer message")}</p>
          <p className={agent ? "text-xs text-primary-foreground/75" : "text-xs text-muted-foreground"}>{meta}</p>
        </div>
        <p className={agent ? "mt-3 whitespace-pre-wrap text-sm leading-7 text-primary-foreground/90" : "mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground"}>{body}</p>
        {attachments.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <Button key={attachment.id} onClick={() => downloadAttachment(attachment.id)} size="sm" type="button" variant={agent ? "secondary" : "outline"}>
                <Download className="size-4" />
                {attachment.fileName}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
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

function EmptyBox({ label }: { label: string }) {
  return (
    <div className="grid min-h-28 place-items-center rounded-lg border border-dashed border-border bg-background/30 px-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function LiveChatSkeleton() {
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
          <ShadowSkeleton className="h-72" />
          <ShadowSkeleton className="h-56" />
        </div>
      </div>
    </div>
  );
}

function displayUser(user?: LiveChatUserSummary | null) {
  const profileName = [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(" ");
  return profileName || user?.email || "";
}

function formatDate(value: string) {
  return formatPlatformDate(value, { dateStyle: "medium", timeStyle: "short" });
}

function formatLabel(value: string) {
  return value.replaceAll(/[._-]/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolveApiUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";
  return new URL(value, apiBase).toString();
}
