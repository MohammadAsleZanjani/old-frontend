import { adminApiRequest } from "./admin-api-request";

export interface AdminSettingsList {
  items: AdminSettingItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminSettingItem {
  createdAt: string;
  group: string;
  id: string;
  isPublic: boolean;
  key: string;
  updatedAt: string;
  value: unknown;
}

export interface SettingsQuery {
  group?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}

export interface UpsertSettingInput {
  group: string;
  isPublic?: boolean;
  key: string;
  value: unknown;
}

export function getAdminSettings(query: SettingsQuery = {}) {
  return systemRequest<AdminSettingsList>("/admin/system/settings", query);
}

export function upsertAdminSetting(input: UpsertSettingInput) {
  return systemRequest<AdminSettingItem>("/admin/system/settings", undefined, { body: input, method: "POST" });
}

async function systemRequest<T>(
  path: string,
  query?: SettingsQuery,
  init: { body?: unknown; method?: string } = {},
) {
  return adminApiRequest<T>(path, { body: init.body, method: init.method, query });
}
