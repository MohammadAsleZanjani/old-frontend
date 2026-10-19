export interface ApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  getAccessToken?: () => Promise<string | null> | string | null;
  /**
   * Called once after an authenticated request receives a 401. Return true
   * after refreshing credentials to replay the request exactly once.
   */
  onUnauthorized?: () => Promise<boolean> | boolean;
}

export type ApiQueryValue = boolean | number | string | null | undefined;

export interface ApiRequestOptions {
  body?: BodyInit | object | unknown[];
  headers?: HeadersInit;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  query?: Record<string, ApiQueryValue>;
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  get<TData>(path: string, options: Omit<ApiRequestOptions, "body" | "method"> = {}) {
    return this.request<TData>(path, { ...options, method: "GET" });
  }

  post<TData>(path: string, body?: ApiRequestOptions["body"], options: Omit<ApiRequestOptions, "body" | "method"> = {}) {
    return this.request<TData>(path, { ...options, body, method: "POST" });
  }

  patch<TData>(path: string, body?: ApiRequestOptions["body"], options: Omit<ApiRequestOptions, "body" | "method"> = {}) {
    return this.request<TData>(path, { ...options, body, method: "PATCH" });
  }

  put<TData>(path: string, body?: ApiRequestOptions["body"], options: Omit<ApiRequestOptions, "body" | "method"> = {}) {
    return this.request<TData>(path, { ...options, body, method: "PUT" });
  }

  delete<TData>(path: string, options: Omit<ApiRequestOptions, "body" | "method"> = {}) {
    return this.request<TData>(path, { ...options, method: "DELETE" });
  }

  async request<TData>(path: string, options: ApiRequestOptions = {}): Promise<TData> {
    return this.execute<TData>(path, options, true);
  }

  private async execute<TData>(path: string, options: ApiRequestOptions, allowRefresh: boolean): Promise<TData> {
    const token = await this.options.getAccessToken?.();
    const body = prepareBody(options.body);
    const requestFetch = this.options.fetch ?? fetch;
    const response = await requestFetch(`${this.options.baseUrl}${path}${toQueryString(options.query)}`, {
      body: body.value,
      headers: {
        ...(body.isJson ? { "content-type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      method: options.method ?? "GET",
      signal: options.signal,
    });

    if (response.status === 401 && allowRefresh && token && this.options.onUnauthorized) {
      const refreshed = await this.options.onUnauthorized();
      if (refreshed) return this.execute<TData>(path, options, false);
    }

    const payload = await response.json().catch(() => undefined);
    if (!response.ok) throw new ApiClientError(readApiError(payload) ?? `API request failed: ${response.status}`, response.status, payload);
    return payload as TData;
  }
}

function prepareBody(body: ApiRequestOptions["body"]): { isJson: boolean; value?: BodyInit } {
  if (body === undefined) return { isJson: false };
  if (
    typeof body === "string"
    || body instanceof ArrayBuffer
    || ArrayBuffer.isView(body)
    || (typeof Blob !== "undefined" && body instanceof Blob)
    || (typeof FormData !== "undefined" && body instanceof FormData)
    || (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams)
  ) {
    return { isJson: false, value: body as BodyInit };
  }
  return { isJson: true, value: JSON.stringify(body) };
}

function toQueryString(query?: Record<string, ApiQueryValue>) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

function readApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(", ");
  }
  const message = record.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(", ");
  return undefined;
}
