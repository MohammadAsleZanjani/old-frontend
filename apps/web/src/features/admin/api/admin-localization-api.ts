import { adminApiRequest } from "./admin-api-request";

export type LanguageDirection = "LTR" | "RTL";
export type TranslationStatus = "MISSING" | "DRAFT" | "MACHINE_TRANSLATED" | "MANUAL" | "REVIEWED" | "PUBLISHED";

export interface LocalizationQuery {
  language?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: TranslationStatus;
}

export interface LocalizationPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LanguageItem {
  code: string;
  createdAt: string;
  deletedAt?: string | null;
  direction: LanguageDirection;
  id: string;
  isDefault: boolean;
  isEnabled: boolean;
  name: string;
  nativeName: string;
  sortOrder: number;
  updatedAt: string;
}

export interface TranslationRecordItem {
  createdAt: string;
  id: string;
  isManual: boolean;
  key: string;
  language: LanguageItem;
  languageId: string;
  namespace?: string;
  source: string;
  status: TranslationStatus;
  updatedAt: string;
  value: unknown;
}

export interface AiTranslationLogItem {
  createdAt: string;
  entityId?: string | null;
  entityType: string;
  error?: string | null;
  field?: string | null;
  force: boolean;
  id: string;
  language: LanguageItem;
  languageId: string;
  model?: string | null;
  provider: string;
  resultValue?: unknown;
  sourceLanguage: string;
  sourceValue: unknown;
  status: TranslationStatus;
}

export interface UpsertLanguageInput {
  code: string;
  direction: LanguageDirection;
  isDefault?: boolean;
  isEnabled?: boolean;
  name: string;
  nativeName: string;
  sortOrder?: number;
}

export interface UpsertTranslationInput {
  key: string;
  languageCode: string;
  namespace: string;
  status?: TranslationStatus;
  value: Record<string, unknown>;
}

export interface GenerateAiTranslationInput {
  entityId?: string;
  entityType: string;
  field?: string;
  force?: boolean;
  sourceLanguage: string;
  sourceValue: Record<string, unknown>;
  targetLanguage: string;
}

export function getAdminLanguages(query: LocalizationQuery = {}) {
  return localizationRequest<LocalizationPage<LanguageItem>>("/admin/localization/languages", query);
}

export function upsertAdminLanguage(input: UpsertLanguageInput) {
  return localizationRequest<LanguageItem>("/admin/localization/languages", undefined, { body: input, method: "POST" });
}

export function getAdminTranslations(query: LocalizationQuery = {}) {
  return localizationRequest<LocalizationPage<TranslationRecordItem>>("/admin/localization/translations", query);
}

export function upsertAdminTranslation(input: UpsertTranslationInput) {
  return localizationRequest<TranslationRecordItem>("/admin/localization/translations", undefined, { body: input, method: "POST" });
}

export function generateAdminAiTranslation(input: GenerateAiTranslationInput) {
  return localizationRequest<{ applied: boolean; log: AiTranslationLogItem; reason?: string; resultValue?: unknown }>("/admin/localization/ai-translations/generate", undefined, { body: input, method: "POST" });
}

export function getAdminAiTranslationLogs(query: LocalizationQuery = {}) {
  return localizationRequest<LocalizationPage<AiTranslationLogItem>>("/admin/localization/ai-translations/logs", query);
}

async function localizationRequest<T>(path: string, query?: LocalizationQuery, init: { body?: unknown; method?: string } = {}) {
  return adminApiRequest<T>(path, { body: init.body, method: init.method, query });
}
