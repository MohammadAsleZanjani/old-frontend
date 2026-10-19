"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Archive, Loader2, MessageCircle, Paperclip, Phone, Send, X } from "lucide-react";
import { toast } from "@/shared/ui/sonner";

import {
  createLiveChatSocket,
  getMyLiveChat,
  getMyLiveChats,
  joinLiveChatConversation,
  mergeLiveChatMessage,
  sendLiveChatMessage,
  startLiveChat,
  type AdminLiveChatDetail,
  type LiveChatMessageEvent,
} from "@/domains/live-chat/live-chat-api";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useI18n } from "@/shared/i18n";
import { uploadFile, type UploadApiResult } from "@/shared/uploads/upload-api";

const COPY = {
  fa: {
    attach: "پیوست فایل",
    auth: "برای گفتگوی مستقیم با پشتیبانی وارد حساب خود شوید.",
    close: "بستن چت",
    closedNotice: "این گفتگو توسط پشتیبانی بسته شده است. برای ادامه، یک گفتگوی جدید از داشبورد شروع کنید.",
    dashboard: "تاریخچه",
    whatsapp: "واتس‌اپ",
    greet: "سلام! چطور می‌توانیم کمکتان کنیم؟",
    history: "گفتگوهای اخیر",
    login: "ورود به حساب",
    open: "باز کردن چت",
    phone: "تماس تلفنی",
    placeholder: "پیام خود را بنویسید...",
    quick: "تماس سریع",
    send: "ارسال پیام",
    subject: "گفتگوی سایت",
    subtitle: "گفتگوی مستقیم با تیم پشتیبانی ستایش",
    title: "پشتیبانی زنده",
    uploading: "در حال آپلود...",
  },
  en: {
    attach: "Attach file",
    auth: "Sign in to chat directly with support.",
    close: "Close chat",
    closedNotice: "This chat was closed by support. Start a new conversation from your dashboard to continue.",
    dashboard: "View all conversations",
    whatsapp: "WhatsApp",
    greet: "Hi! How can we help you today?",
    history: "Recent chats",
    login: "Sign in",
    open: "Open chat",
    phone: "Call",
    placeholder: "Type your message...",
    quick: "Quick contact",
    send: "Send message",
    subject: "Website live chat",
    subtitle: "Direct chat with Setayesh support",
    title: "Live Support",
    uploading: "Uploading...",
  },
  ar: {
    attach: "إرفاق ملف",
    auth: "سجّل الدخول للدردشة مباشرة مع الدعم.",
    close: "إغلاق الدردشة",
    closedNotice: "أغلق فريق الدعم هذه المحادثة. ابدأ محادثة جديدة من لوحة التحكم للمتابعة.",
    dashboard: "عرض كل المحادثات",
    whatsapp: "واتساب",
    greet: "مرحبًا! كيف يمكننا مساعدتك؟",
    history: "المحادثات الحديثة",
    login: "تسجيل الدخول",
    open: "فتح الدردشة",
    phone: "اتصال",
    placeholder: "اكتب رسالتك...",
    quick: "اتصال سريع",
    send: "إرسال الرسالة",
    subject: "دردشة الموقع",
    subtitle: "دردشة مباشرة مع دعم ستايش",
    title: "الدعم المباشر",
    uploading: "جارٍ الرفع...",
  },
};

const PHONE = "+982191550859";

interface LiveChatListItem {
  conversationNo: string;
  id: string;
  status: string;
  subject?: string | null;
  updatedAt: string;
}

interface LiveChatPage {
  items: LiveChatListItem[];
}

export default function LiveChat() {
  const { lang } = useI18n();
  const { loading, user } = useAuth();
  const t = COPY[lang as keyof typeof COPY] ?? COPY.fa;
  const isRtl = lang !== "en";
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [conversation, setConversation] = useState<AdminLiveChatDetail | null>(null);
  const [recent, setRecent] = useState<LiveChatListItem[]>([]);
  const [stateOwnerId, setStateOwnerId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<UploadApiResult[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof createLiveChatSocket> | null>(null);
  const joinedRef = useRef(false);
  const stateMatchesUser = Boolean(user?.id && stateOwnerId === user.id);
  const activeConversation = stateMatchesUser ? conversation : null;
  const visibleRecent = stateMatchesUser ? recent : [];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setConversation(null);
    setRecent([]);
    setStateOwnerId(null);
    setAttachments([]);
    setMsg("");
  }, [user?.id]);

  useEffect(() => {
    if (!open || !user) return;
    void getMyLiveChats({ page: 1, pageSize: 5, sortOrder: "desc" })
      .then((page) => {
        const items = (page as LiveChatPage).items ?? [];
        setRecent(items);
        setStateOwnerId(user.id);
      })
      .catch(() => undefined);
  }, [open, user]);

  useEffect(() => {
    if (!activeConversation?.id || !user) return;
    const socket = createLiveChatSocket();
    socketRef.current = socket;
    joinedRef.current = false;
    socket.on("connect", () => {
      joinLiveChatConversation(socket, { conversationId: activeConversation.id, role: "CUSTOMER" });
      joinedRef.current = true;
    });
    socket.on("disconnect", () => {
      joinedRef.current = false;
    });
    socket.on("message:new", (event: LiveChatMessageEvent) => {
      if (event.conversationId !== activeConversation.id) return;
      setConversation((current) => (current ? mergeLiveChatMessage(current, event.message) : current));
    });
    socket.on("conversation:closed", () => {
      setConversation((current) => (current ? { ...current, status: "CLOSED" } : current));
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
      joinedRef.current = false;
    };
  }, [activeConversation?.id, user]);

  useEffect(() => {
    if (!activeConversation?.id || !user) return;
    const interval = window.setInterval(() => {
      void getMyLiveChat(activeConversation.id)
        .then((next) => setConversation(next as AdminLiveChatDetail))
        .catch(() => undefined);
    }, 4_000);
    return () => window.clearInterval(interval);
  }, [activeConversation?.id, user]);

  if (!mounted) return null;

  const uploadAttachments = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(selected.slice(0, 3).map((file) => uploadFile({ entityType: "live-chat-widget", file, visibility: "PRIVATE" })));
      setAttachments((current) => [...uploads, ...current]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const send = async () => {
    if (!user || loading) return;
    const body = msg.trim();
    if (!body && !attachments.length) return;
    setSending(true);
    try {
      let active = activeConversation;
      if (!active) {
        active = (await startLiveChat({ message: attachments.length ? undefined : body, subject: t.subject })) as AdminLiveChatDetail;
        setConversation(active);
        setStateOwnerId(user.id);
        setRecent((current) => [active as unknown as LiveChatListItem, ...current.filter((item) => item.id !== active?.id)].slice(0, 5));
        if (!attachments.length) {
          setMsg("");
          return;
        }
      }
      const payload = {
        attachments: attachments.map((attachment) => ({
          fileName: attachment.originalName || attachment.fileName,
          mimeType: attachment.mimeType,
          sizeBytes: Number(attachment.sizeBytes),
          uploadId: attachment.id,
        })),
        body,
      };
      const message = await sendLiveChatMessage(active.id, payload);
      setConversation((current) => (current ? mergeLiveChatMessage(current, message as AdminLiveChatDetail["messages"][number]) : current));
      setMsg("");
      setAttachments([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Live chat message failed");
    } finally {
      setSending(false);
    }
  };

  const sideClass = isRtl ? "left-4 sm:left-6" : "right-4 sm:right-6";
  const closed = activeConversation?.status === "CLOSED";
  const messages = activeConversation?.messages ?? [];

  return (
    <div className={`fixed bottom-4 sm:bottom-6 ${sideClass} z-[60]`} dir={isRtl ? "rtl" : "ltr"}>
      {open && (
        <div
          ref={panelRef}
          className="mb-3 flex h-[min(78vh,34rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">{t.title}</div>
                <div className="text-[11px] text-muted-foreground">{t.subtitle}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t.close} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent/20 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!user && !loading ? (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm">
                <p className="leading-6 text-foreground">{t.auth}</p>
                <Link className="inline-flex rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground" href="/auth">
                  {t.login}
                </Link>
              </div>
            ) : null}

            {user && !activeConversation && visibleRecent.length ? (
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.history}</div>
                {visibleRecent.slice(0, 3).map((item) => (
                  <button
                    className="block w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-start text-xs hover:border-primary/50 hover:bg-primary/5"
                    key={item.id}
                    onClick={() => {
                      setConversation({ id: item.id, conversationNo: item.conversationNo, messages: [], status: item.status, attachments: [], createdAt: item.updatedAt, events: [], participants: [], startedAt: item.updatedAt, updatedAt: item.updatedAt } as AdminLiveChatDetail);
                    }}
                    type="button"
                  >
                    <span className="font-semibold">{item.conversationNo}</span>
                    <span className="ms-2 text-muted-foreground">{liveChatStatusLabel(item.status, lang)}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {!messages.length ? (
              <div className="rounded-2xl rounded-bs-sm bg-accent/15 px-3 py-2 text-sm text-foreground">{t.greet}</div>
            ) : null}

            {messages.map((message) => {
              const mine = message.role === "CUSTOMER" || message.sender?.id === user?.id;
              return (
                <div className={mine ? "flex justify-end" : "flex justify-start"} key={message.id}>
                  <div className={mine ? "max-w-[82%] rounded-2xl rounded-ee-sm bg-primary px-3 py-2 text-sm text-primary-foreground" : "max-w-[82%] rounded-2xl rounded-es-sm bg-accent/15 px-3 py-2 text-sm text-foreground"}>
                    {message.body ? <p className="whitespace-pre-wrap leading-6">{message.body}</p> : null}
                    {message.attachments.length ? <p className="mt-1 text-xs opacity-75">{message.attachments.length} file(s)</p> : null}
                  </div>
                </div>
              );
            })}

            {closed ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200">
                {t.closedNotice}
              </div>
            ) : null}
          </div>

          {attachments.length ? (
            <div className="border-t border-border/60 px-4 py-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <button className="rounded-full border border-border/60 px-2 py-1 text-[11px] text-muted-foreground" key={attachment.id} onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))} type="button">
                    {attachment.originalName || attachment.fileName} ×
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <input className="hidden" multiple onChange={(event) => uploadAttachments(event.target.files)} ref={fileInputRef} type="file" />
              <button
                aria-label={t.attach}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
                disabled={!user || closed || uploading || sending}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <input
                value={msg}
                onChange={(event) => setMsg(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void send();
                }}
                placeholder={uploading ? t.uploading : t.placeholder}
                disabled={!user || closed || sending}
                className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60"
              />
              <button
                onClick={() => void send()}
                aria-label={t.send}
                disabled={!user || closed || sending || uploading || (!msg.trim() && !attachments.length)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                type="button"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className={`h-4 w-4 ${isRtl ? "-scale-x-100" : ""}`} />}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:${PHONE}`} className="flex items-center justify-center gap-1 rounded-xl border border-border/60 bg-background/40 px-2 py-2 text-[11px] text-foreground hover:border-primary/50 hover:bg-accent/15">
                <Phone className="h-4 w-4 text-primary" />
                {t.phone}
              </a>
              <Link href="/user/support/live-chat" className="flex items-center justify-center gap-1 rounded-xl border border-border/60 bg-background/40 px-2 py-2 text-[11px] text-foreground hover:border-primary/50 hover:bg-accent/15">
                <Archive className="h-4 w-4 text-primary" />
                {t.dashboard}
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? t.close : t.open}
        className="group grid h-14 w-14 place-items-center rounded-full bg-gradient-gold text-primary-foreground shadow-xl transition hover:scale-105"
        type="button"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

function liveChatStatusLabel(status: string, lang: string) {
  const labels: Record<string, Record<"fa" | "en" | "ar", string>> = {
    ACTIVE: { ar: "نشطة", en: "Active", fa: "فعال" },
    CLOSED: { ar: "مغلقة", en: "Closed", fa: "بسته‌شده" },
    MISSED: { ar: "فائتة", en: "Missed", fa: "بی‌پاسخ" },
    REQUESTED: { ar: "بانتظار الرد", en: "Awaiting response", fa: "در انتظار پاسخ" },
    WAITING: { ar: "قيد الانتظار", en: "Waiting", fa: "در انتظار" },
  };
  const locale = lang as "fa" | "en" | "ar";
  return labels[status.toUpperCase()]?.[locale] ?? labels[status.toUpperCase()]?.fa ?? status;
}
