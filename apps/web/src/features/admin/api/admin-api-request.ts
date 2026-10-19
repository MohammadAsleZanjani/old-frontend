import { fetchWithAuthRefresh } from "@/shared/auth/platform-auth-client";
import { extractApiError } from "@/shared/lib/api-error";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noghre.land/api/v1";

interface AdminApiRequestOptions {
  accessToken?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  query?: object;
}

export async function adminApiRequest<T>(path: string, options: AdminApiRequestOptions = {}) {
  const response = await fetchWithAuthRefresh(
    `${API_BASE}${path}${toQueryString(options.query)}`,
    {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: options.body === undefined ? options.headers : { "content-type": "application/json", ...options.headers },
      method: options.method ?? "GET",
    },
    { accessToken: options.accessToken },
  );
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) throw new Error(readApiError(payload) ?? `Admin request failed: ${response.status}`);
  return payload as T;
}

export async function adminApiBlobRequest(path: string, options: AdminApiRequestOptions = {}) {
  const response = await fetchWithAuthRefresh(`${API_BASE}${path}${toQueryString(options.query)}`, {}, { accessToken: options.accessToken });
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new Error(readApiError(payload) ?? `Admin request failed: ${response.status}`);
  }
  return response;
}

export function readApiError(payload: unknown) {
  return extractApiError(payload);
}

function toQueryString(query?: object) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if ((typeof value === "boolean" || typeof value === "number" || typeof value === "string") && value !== "") {
      params.set(key, String(value));
    }
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}
