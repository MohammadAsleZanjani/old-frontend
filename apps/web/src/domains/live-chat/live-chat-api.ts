import { io, type Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";
const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE.replace(/\/api\/v1$/, "");

export interface LiveChatRequestOptions {
  accessToken?: string;
}

export interface LiveChatAttachmentInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadId?: string;
}

export interface StartLiveChatInput {
  message?: string;
  metadata?: Record<string, unknown>;
  subject?: string;
  visitorEmail?: string;
  visitorId?: string;
  visitorName?: string;
}

export interface SendLiveChatMessageInput {
  attachments?: LiveChatAttachmentInput[];
  body?: string;
}

export interface LiveChatListQuery {
  assignedAgentId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: "REQUESTED" | "ACTIVE" | "WAITING" | "CLOSED" | "MISSED";
}

export type LiveChatStatus = NonNullable<LiveChatListQuery["status"]>;

export interface LiveChatUserSummary {
  email?: string | null;
  id: string;
  mobile?: string | null;
  profile?: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface LiveChatAttachment {
  fileName: string;
  id: string;
  mimeType: string;
  sizeBytes: string;
  uploadId?: string | null;
}

export interface LiveChatSignedUrl {
  expiresAt?: string | null;
  url: string;
}

export interface AdminLiveChatDetail {
  assignedAgent?: LiveChatUserSummary | null;
  assignedAgentId?: string | null;
  attachments: LiveChatAttachment[];
  closedAt?: string | null;
  conversationNo: string;
  createdAt: string;
  customer?: LiveChatUserSummary | null;
  events: Array<{
    actorId?: string | null;
    createdAt: string;
    id: string;
    metadata?: Record<string, unknown> | null;
    type: string;
  }>;
  id: string;
  ipAddress?: string | null;
  lastMessageAt?: string | null;
  messages: Array<{
    attachments: LiveChatAttachment[];
    body?: string | null;
    createdAt: string;
    id: string;
    readReceipts: Array<{ id: string; readAt: string; userId: string }>;
    role: "AGENT" | "CUSTOMER" | "SYSTEM";
    sender?: LiveChatUserSummary | null;
    status: "SENT" | "DELIVERED" | "READ";
    type: "ATTACHMENT" | "SYSTEM" | "TEXT";
  }>;
  participants: Array<{
    displayName?: string | null;
    id: string;
    isOnline: boolean;
    joinedAt?: string | null;
    lastSeenAt?: string | null;
    leftAt?: string | null;
    role: "AGENT" | "CUSTOMER" | "SYSTEM";
    userId?: string | null;
  }>;
  startedAt: string;
  status: LiveChatStatus;
  subject?: string | null;
  updatedAt: string;
  userAgent?: string | null;
  visitorEmail?: string | null;
  visitorId?: string | null;
  visitorName?: string | null;
}

export type LiveChatRole = AdminLiveChatDetail["messages"][number]["role"];
export type LiveChatParticipantRole = AdminLiveChatDetail["participants"][number]["role"];
export type LiveChatMessage = AdminLiveChatDetail["messages"][number];
export type LiveChatParticipant = AdminLiveChatDetail["participants"][number];

export interface LiveChatPresenceEvent {
  conversationId: string;
  online: boolean;
  role: LiveChatParticipantRole;
  userId?: string | null;
}

export interface LiveChatTypingEvent {
  conversationId: string;
  isTyping: boolean;
  role: LiveChatParticipantRole;
  userId?: string | null;
}

export interface LiveChatReadEvent {
  conversationId: string;
  read: number;
  userId: string;
}

export interface LiveChatMessageEvent {
  conversationId: string;
  message: LiveChatMessage;
}

export interface LiveChatConversationEvent {
  conversation: Partial<AdminLiveChatDetail>;
  conversationId: string;
}

export function startLiveChat(input: StartLiveChatInput, options: LiveChatRequestOptions = {}) {
  return liveChatFetch("/live-chat/conversations", { accessToken: options.accessToken, body: input, method: "POST" });
}

export function getMyLiveChats(query: LiveChatListQuery = {}, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/live-chat/conversations${toQuery(query)}`, { accessToken: options.accessToken });
}

export function getMyLiveChat(id: string, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/live-chat/conversations/${id}`, { accessToken: options.accessToken });
}

export function sendLiveChatMessage(id: string, input: SendLiveChatMessageInput, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/live-chat/conversations/${id}/messages`, { accessToken: options.accessToken, body: input, method: "POST" });
}

export function markLiveChatRead(id: string, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/live-chat/conversations/${id}/read`, { accessToken: options.accessToken, body: {}, method: "PATCH" });
}

export function closeMyLiveChat(id: string, reason?: string, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/live-chat/conversations/${id}/close`, { accessToken: options.accessToken, body: { reason }, method: "PATCH" });
}

export function getAdminLiveChats(query: LiveChatListQuery = {}, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/admin/live-chat/conversations${toQuery(query)}`, { accessToken: options.accessToken });
}

export function getAdminLiveChat(id: string, options: LiveChatRequestOptions = {}) {
  return liveChatFetch<AdminLiveChatDetail>(`/admin/live-chat/conversations/${id}`, { accessToken: options.accessToken });
}

export function sendAdminLiveChatMessage(id: string, input: SendLiveChatMessageInput, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/admin/live-chat/conversations/${id}/messages`, { accessToken: options.accessToken, body: input, method: "POST" });
}

export function assignLiveChat(id: string, assignedAgentId?: string, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/admin/live-chat/conversations/${id}/assign`, { accessToken: options.accessToken, body: { assignedAgentId }, method: "PATCH" });
}

export function closeLiveChat(id: string, reason?: string, options: LiveChatRequestOptions = {}) {
  return liveChatFetch(`/admin/live-chat/conversations/${id}/close`, { accessToken: options.accessToken, body: { reason }, method: "PATCH" });
}

export function getLiveChatAttachmentSignedUrl(conversationId: string, attachmentId: string, options: LiveChatRequestOptions & { admin?: boolean } = {}) {
  const prefix = options.admin ? "/admin/live-chat" : "/live-chat";
  return liveChatFetch<LiveChatSignedUrl>(`${prefix}/conversations/${conversationId}/attachments/${attachmentId}/signed-url`, { accessToken: options.accessToken });
}

export function createLiveChatSocket(options: LiveChatRequestOptions = {}): Socket {
  const token = options.accessToken ?? getStoredAccessToken();
  return io(`${SOCKET_BASE}/live-chat`, {
    auth: token ? { token } : undefined,
    transports: ["websocket"],
  });
}

export function joinLiveChatConversation(socket: Socket, input: { conversationId: string; displayName?: string; role: LiveChatParticipantRole }) {
  socket.emit("conversation:join", input);
}

export function sendLiveChatSocketMessage(socket: Socket, input: { conversationId: string; message: SendLiveChatMessageInput; role: LiveChatParticipantRole }) {
  return emitLiveChatSocketWithMessageBroadcast(socket, input);
}

export function sendLiveChatTyping(socket: Socket, input: { conversationId: string; isTyping: boolean; role: LiveChatParticipantRole }) {
  socket.emit("typing", input);
}

export function markLiveChatSocketRead(socket: Socket, input: { conversationId: string; role: LiveChatParticipantRole }) {
  socket.emit("messages:read", input);
}

export function closeLiveChatSocket(socket: Socket, input: { conversationId: string; reason?: string }) {
  return emitLiveChatSocket<Partial<AdminLiveChatDetail>>(socket, "conversation:close", { conversationId: input.conversationId, payload: { reason: input.reason } });
}

export function mergeLiveChatMessage(conversation: AdminLiveChatDetail, message: LiveChatMessage): AdminLiveChatDetail {
  if (conversation.messages.some((item) => item.id === message.id)) return conversation;
  return {
    ...conversation,
    lastMessageAt: message.createdAt,
    messages: [...conversation.messages, message],
    status: message.role === "AGENT" ? "WAITING" : "ACTIVE",
    updatedAt: message.createdAt,
  };
}

function emitLiveChatSocket<T>(socket: Socket, event: string, payload: unknown) {
  return new Promise<T>((resolve, reject) => {
    socket.timeout(8000).emit(event, payload, (error: Error | null, response: T | { error?: string }) => {
      if (error) {
        reject(error);
        return;
      }
      if (response && typeof response === "object" && "error" in response && response.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response as T);
    });
  });
}

function emitLiveChatSocketWithMessageBroadcast(socket: Socket, input: { conversationId: string; message: SendLiveChatMessageInput; role: LiveChatParticipantRole }) {
  return new Promise<LiveChatMessage>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      socket.off("message:new", onBroadcast);
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const onBroadcast = (event: LiveChatMessageEvent) => {
      if (!isMatchingMessageBroadcast(event, input)) return;
      finish(() => resolve(event.message));
    };

    socket.on("message:new", onBroadcast);
    socket.timeout(8000).emit("message:send", input, (error: Error | null, response: LiveChatMessage | { error?: string }) => {
      if (error) {
        finish(() => reject(error));
        return;
      }
      if (response && typeof response === "object" && "error" in response && response.error) {
        finish(() => reject(new Error(response.error)));
        return;
      }
      finish(() => resolve(response as LiveChatMessage));
    });
  });
}

function isMatchingMessageBroadcast(event: LiveChatMessageEvent, input: { conversationId: string; message: SendLiveChatMessageInput; role: LiveChatParticipantRole }) {
  if (event.conversationId !== input.conversationId || event.message.role !== input.role) return false;

  const expectedBody = (input.message.body ?? "").trim();
  const actualBody = (event.message.body ?? "").trim();
  if (expectedBody !== actualBody) return false;

  const expectedUploads = new Set((input.message.attachments ?? []).map((attachment) => attachment.uploadId).filter(Boolean));
  if (!expectedUploads.size) return true;

  return event.message.attachments.some((attachment) => attachment.uploadId && expectedUploads.has(attachment.uploadId));
}

async function liveChatFetch<T = unknown>(path: string, init: { accessToken?: string; body?: unknown; method?: string } = {}) {
  const token = init.accessToken ?? getStoredAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: init.method ?? "GET",
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(readApiError(payload) ?? `Live chat request failed: ${response.status}`);
  }
  return payload as T;
}

function toQuery(query: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if ((typeof value === "string" || typeof value === "number") && value !== "") params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("setayesh:accessToken") ?? window.localStorage.getItem("accessToken") ?? undefined;
}

function readApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? ((record.error && typeof record.error === "object") ? (record.error as Record<string, unknown>).message : undefined);
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(", ");
  return undefined;
}
