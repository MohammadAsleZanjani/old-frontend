import { adminApiRequest } from "./admin-api-request";

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "TELEGRAM" | "PUSH";
export type NotificationDeliveryStatus = "PENDING" | "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";
export type NotificationBroadcastStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface NotificationListQuery {
  channel?: NotificationChannel;
  event?: string;
  page?: number;
  pageSize?: number;
  priority?: NotificationPriority;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: NotificationStatus;
}

export interface AdminNotificationItem {
  actionUrl?: string | null;
  archivedAt?: string | null;
  body: string;
  createdAt: string;
  entityId?: string | null;
  entityType?: string | null;
  event: string;
  id: string;
  logs?: AdminNotificationLogItem[];
  metadata?: unknown;
  priority: NotificationPriority;
  readAt?: string | null;
  status: NotificationStatus;
  title: string;
  updatedAt: string;
  user?: { email?: string | null; id: string; mobile?: string | null; profile?: { firstName?: string | null; lastName?: string | null } | null } | null;
  userId: string;
}

export interface AdminNotificationTemplateItem {
  body: string;
  channel: NotificationChannel;
  createdAt: string;
  id: string;
  isEnabled: boolean;
  key: string;
  language: string;
  metadata?: unknown;
  subject: string;
  updatedAt: string;
}

export interface AdminNotificationLogItem {
  attempts: number;
  channel: NotificationChannel;
  createdAt: string;
  error?: string | null;
  event: string;
  id: string;
  notification?: AdminNotificationItem | null;
  notificationId?: string | null;
  payload?: unknown;
  provider?: string | null;
  providerRef?: string | null;
  recipient?: string | null;
  sentAt?: string | null;
  status: NotificationDeliveryStatus;
  updatedAt: string;
  userId?: string | null;
}

export interface NotificationPage<T> {
  items: T[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SendTestNotificationInput {
  actionUrl?: string;
  body: string;
  channels?: NotificationChannel[];
  entityId?: string;
  entityType?: string;
  event: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
  title: string;
  userId: string;
}

export interface UpsertNotificationTemplateInput {
  body: string;
  channel: NotificationChannel;
  isEnabled?: boolean;
  key: string;
  language?: string;
  metadata?: Record<string, unknown>;
  subject: string;
}

export interface AdminNotificationBroadcastPreview {
  active: number;
  event: string;
  inactive: number;
  pendingVerification: number;
  smsRecipients: number;
  smsTemplate: "notification";
  suspended: number;
  totalRecipients: number;
}

export interface AdminNotificationBroadcast {
  actionUrl?: string | null;
  audienceCreatedBefore: string;
  body: string;
  completedAt?: string | null;
  createdAt: string;
  error?: string | null;
  event: string;
  failedRecipients: number;
  id: string;
  inAppCreated: number;
  lastProcessedUserId?: string | null;
  priority: NotificationPriority;
  processedRecipients: number;
  progress: number;
  requestedBy?: { email?: string | null; id: string; mobile?: string | null; profile?: { firstName?: string | null; lastName?: string | null } | null };
  requestedById: string;
  smsQueued: number;
  smsRecipients: number;
  smsTemplate: "notification";
  startedAt?: string | null;
  status: NotificationBroadcastStatus;
  title: string;
  totalRecipients: number;
  updatedAt: string;
}

export interface CreateNotificationBroadcastInput {
  actionUrl?: string;
  body: string;
  confirmAllCustomers: true;
  priority?: NotificationPriority;
  title: string;
}

export function getAdminNotifications(query: NotificationListQuery = {}) {
  return notificationRequest<NotificationPage<AdminNotificationItem>>("/admin/notifications", query);
}

export function getAdminNotificationDetail(id: string) {
  return notificationRequest<AdminNotificationItem>(`/admin/notifications/${id}`);
}

export function getAdminNotificationTemplates(query: NotificationListQuery = {}) {
  return notificationRequest<NotificationPage<AdminNotificationTemplateItem>>("/admin/notifications/templates", query);
}

export function getAdminNotificationLogs(query: NotificationListQuery = {}) {
  return notificationRequest<NotificationPage<AdminNotificationLogItem>>("/admin/notifications/logs", query);
}

export function sendAdminTestNotification(input: SendTestNotificationInput) {
  return notificationRequest<{ logs: AdminNotificationLogItem[]; notification: AdminNotificationItem }>("/admin/notifications/test", undefined, {
    body: input,
    method: "POST",
  });
}

export function createAdminNotification(input: SendTestNotificationInput) {
  return notificationRequest<{ logs: AdminNotificationLogItem[]; notification: AdminNotificationItem }>("/admin/notifications", undefined, {
    body: input,
    method: "POST",
  });
}

export function markAdminNotificationRead(id: string) {
  return notificationRequest<AdminNotificationItem>(`/admin/notifications/${id}/read`, undefined, {
    body: {},
    method: "PATCH",
  });
}

export function markAllAdminNotificationsRead() {
  return notificationRequest<{ count: number }>("/admin/notifications/read-all", undefined, {
    body: {},
    method: "PATCH",
  });
}

export function upsertAdminNotificationTemplate(input: UpsertNotificationTemplateInput) {
  return notificationRequest<AdminNotificationTemplateItem>("/admin/notifications/templates", undefined, {
    body: input,
    method: "POST",
  });
}

export function getAdminNotificationBroadcastPreview() {
  return adminApiRequest<AdminNotificationBroadcastPreview>("/admin/notifications/broadcasts/preview");
}

export function getAdminNotificationBroadcasts(query: { page?: number; pageSize?: number; status?: NotificationBroadcastStatus } = {}) {
  return adminApiRequest<NotificationPage<AdminNotificationBroadcast>>("/admin/notifications/broadcasts", { query });
}

export function createAdminNotificationBroadcast(input: CreateNotificationBroadcastInput) {
  return adminApiRequest<AdminNotificationBroadcast>("/admin/notifications/broadcasts", { body: input, method: "POST" });
}

export function retryAdminNotificationBroadcast(id: string) {
  return adminApiRequest<AdminNotificationBroadcast>(`/admin/notifications/broadcasts/${id}/retry`, { body: {}, method: "POST" });
}

async function notificationRequest<T>(
  path: string,
  query?: NotificationListQuery,
  init: { body?: unknown; method?: string } = {},
) {
  return adminApiRequest<T>(path, { body: init.body, method: init.method, query });
}
