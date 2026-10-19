import { io, type Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";
const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE.replace(/\/api\/v1$/, "");

export interface NotificationRequestOptions {
  accessToken?: string;
}

export interface NotificationListQuery {
  entityType?: string;
  event?: string;
  page?: number;
  pageSize?: number;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: "UNREAD" | "READ" | "ARCHIVED";
}

export interface NotificationPreferenceInput {
  channel: "IN_APP" | "EMAIL" | "SMS" | "TELEGRAM" | "PUSH";
  enabled: boolean;
  event: string;
  quietFrom?: string;
  quietTo?: string;
}

export interface PushTokenInput {
  deviceId?: string;
  platform: string;
  provider: string;
  token: string;
}

export function getNotifications(query: NotificationListQuery = {}, options: NotificationRequestOptions = {}) {
  return notificationFetch(`/notifications${toQuery(query)}`, { accessToken: options.accessToken });
}

export function getUnreadNotificationCount(options: NotificationRequestOptions = {}) {
  return notificationFetch("/notifications/unread-count", { accessToken: options.accessToken });
}

export function markNotificationRead(id: string, options: NotificationRequestOptions = {}) {
  return notificationFetch(`/notifications/${id}/read`, { accessToken: options.accessToken, body: {}, method: "PATCH" });
}

export function markAllNotificationsRead(options: NotificationRequestOptions = {}) {
  return notificationFetch("/notifications/read-all", { accessToken: options.accessToken, body: {}, method: "PATCH" });
}

export function archiveNotification(id: string, options: NotificationRequestOptions = {}) {
  return notificationFetch(`/notifications/${id}/archive`, { accessToken: options.accessToken, body: {}, method: "PATCH" });
}

export function getNotificationPreferences(options: NotificationRequestOptions = {}) {
  return notificationFetch("/notifications/preferences", { accessToken: options.accessToken });
}

export function updateNotificationPreferences(preferences: NotificationPreferenceInput[], options: NotificationRequestOptions = {}) {
  return notificationFetch("/notifications/preferences", {
    accessToken: options.accessToken,
    body: { preferences },
    method: "PATCH",
  });
}

export function registerPushToken(input: PushTokenInput, options: NotificationRequestOptions = {}) {
  return notificationFetch("/notifications/push-tokens", { accessToken: options.accessToken, body: input, method: "POST" });
}

export function createNotificationsSocket(options: NotificationRequestOptions = {}): Socket {
  const token = options.accessToken ?? getStoredAccessToken();
  return io(`${SOCKET_BASE}/notifications`, {
    auth: token ? { token } : undefined,
    transports: ["websocket"],
  });
}

async function notificationFetch(path: string, init: { accessToken?: string; body?: unknown; method?: string } = {}) {
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
    throw new Error(readApiError(payload) ?? `Notification request failed: ${response.status}`);
  }
  return payload;
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
  return window.localStorage.getItem("noghre:accessToken") ?? window.localStorage.getItem("accessToken") ?? undefined;
}

function readApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? ((record.error && typeof record.error === "object") ? (record.error as Record<string, unknown>).message : undefined);
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(", ");
  return undefined;
}
