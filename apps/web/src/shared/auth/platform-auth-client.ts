const CONFIGURED_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://noghre.land/api/v1";
export const API_BASE = resolveBrowserApiBase(CONFIGURED_API_BASE);
const ACCESS_TOKEN_KEY = "noghre:accessToken";
const REFRESH_TOKEN_KEY = "noghre:refreshToken";
const AUTH_EVENT = "noghre:auth-state";

let refreshSessionPromise: Promise<AuthResult<AuthSession>> | null = null;

export interface PlatformUser {
  authMethods?: {
    emailOtp: boolean;
    mobileOtp: boolean;
    password: boolean;
    providers: string[];
  };
  email?: string;
  emailVerifiedAt?: string | null;
  id: string;
  mobile?: string | null;
  mobileVerifiedAt?: string | null;
  kycStatus?: string;
  profile?: {
    avatarUrl?: string | null;
    firstName?: string | null;
    idCardNo?: string | null;
    lastName?: string | null;
    locale?: string;
    timezone?: string;
  } | null;
  profileCompletionRequired?: boolean;
  roles?: string[];
  status?: string;
  user_metadata?: {
    avatar_url?: string | null;
    name?: string;
  };
}

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export type OAuthProvider = "google" | "apple";

export interface TwoFactorChallenge {
  channel: "EMAIL" | "SMS";
  expiresAt: string;
  identifier: string;
  twoFactorRequired: true;
}

export interface PlatformSession {
  createdAt: string;
  deviceName?: string | null;
  expiresAt: string;
  id: string;
  ipAddress?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  userAgent?: string | null;
}

interface AuthResult<T = unknown> {
  data?: T;
  error: Error | null;
}

export const platformAuth = {
  getAccessToken,
  getRefreshToken,
  getSession: async (): Promise<AuthResult<{ session: AuthSession | null }>> => ({
    data: { session: readStoredSession() },
    error: null,
  }),
  completeSessionFromUrl: (params: URLSearchParams) => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const sessionId = params.get("sessionId") ?? "";
    if (!accessToken || !refreshToken) return false;
    persistSession({ accessToken, refreshToken, sessionId });
    return true;
  },
  getUser: async (): Promise<AuthResult<{ user: PlatformUser | null }>> => {
    const token = getAccessToken();
    if (!token) return { data: { user: null }, error: null };

    const response = await authFetch<PlatformUser>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.error && getRefreshToken()) {
      const refreshed = await platformAuth.refreshSession();
      if (!refreshed.error) return platformAuth.getUser();
    }

    return response.error ? { data: { user: null }, error: response.error } : { data: { user: response.data ?? null }, error: null };
  },
  onAuthStateChange: (callback?: (user: PlatformUser | null) => void) => {
    const listener = () => {
      void platformAuth.getUser().then((result) => callback?.(result.data?.user ?? null));
    };
    window.addEventListener(AUTH_EVENT, listener);
    return { data: { subscription: { unsubscribe: () => window.removeEventListener(AUTH_EVENT, listener) } } };
  },
  refreshSession: async (): Promise<AuthResult<AuthSession>> => {
    if (!refreshSessionPromise) {
      refreshSessionPromise = refreshSession().finally(() => {
        refreshSessionPromise = null;
      });
    }
    return refreshSessionPromise;
  },
  revokeSession: async (sessionId: string): Promise<AuthResult<{ revoked: boolean }>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before revoking a session") };
    return authFetch<{ revoked: boolean }>(`/auth/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      method: "DELETE",
    });
  },
  changePassword: async (input: { currentPassword: string; newPassword: string }): Promise<AuthResult<{ changed: boolean; otherSessionsRevoked: boolean }>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before changing your password") };
    return authFetch<{ changed: boolean; otherSessionsRevoked: boolean }>("/auth/password", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "PATCH",
    });
  },
  setPassword: async (input: { confirmPassword: string; password: string }): Promise<AuthResult<{ passwordSet: boolean }>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before setting a password") };
    return authFetch<{ passwordSet: boolean }>("/auth/password/set", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "POST",
    });
  },
  requestContactMobile: async (mobile: string): Promise<AuthResult<{ expiresAt: string; identifier: string; sent: boolean }>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before adding a mobile number") };
    return authFetch("/auth/contacts/mobile/request", {
      body: JSON.stringify({ mobile }),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "POST",
    });
  },
  verifyContactMobile: async (input: { code: string; mobile: string }): Promise<AuthResult<PlatformUser>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before verifying a mobile number") };
    return authFetch("/auth/contacts/mobile/verify", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "POST",
    });
  },
  requestContactEmail: async (email: string): Promise<AuthResult<{ expiresAt: string; identifier: string; sent: boolean }>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before adding an email") };
    return authFetch("/auth/contacts/email/request", {
      body: JSON.stringify({ email }),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "POST",
    });
  },
  verifyContactEmail: async (input: { code: string; email: string }): Promise<AuthResult<PlatformUser>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before verifying an email") };
    return authFetch("/auth/contacts/email/verify", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "POST",
    });
  },
  sessions: async (): Promise<AuthResult<PlatformSession[]>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before viewing sessions") };
    return authFetch<PlatformSession[]>("/auth/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  requestEmailOtp: async (input: { email: string; purpose: "LOGIN" | "EMAIL_VERIFICATION" | "PASSWORD_RESET" }): Promise<AuthResult<{ expiresAt: string; sent: boolean }>> => {
    return authFetch<{ expiresAt: string; sent: boolean }>("/auth/otp/email/request", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  },
  requestSmsOtp: async (input: { mobile: string; purpose: "LOGIN" | "PASSWORD_RESET" }): Promise<AuthResult<{ expiresAt: string; sent: boolean }>> => {
    return authFetch<{ expiresAt: string; sent: boolean }>("/auth/otp/sms/request", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  },
  signInWithPassword: async (input: { identifier: string; password: string }): Promise<AuthResult<AuthSession | TwoFactorChallenge>> => {
    const result = await authFetch<AuthSession | TwoFactorChallenge>("/auth/login", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (result.data && "accessToken" in result.data) persistSession(result.data);
    return result;
  },
  verifyOtp: async (input: { channel: "EMAIL" | "SMS"; code: string; identifier: string; purpose: "LOGIN" | "EMAIL_VERIFICATION" | "PASSWORD_RESET" }): Promise<AuthResult<AuthSession | { resetToken?: string; resetTokenIssued?: boolean; verified?: boolean }>> => {
    const result = await authFetch<AuthSession | { resetToken?: string; resetTokenIssued?: boolean; verified?: boolean }>("/auth/otp/verify", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (result.data && "accessToken" in result.data) persistSession(result.data);
    return result;
  },
  resetPassword: async (input: { password: string; token: string }): Promise<AuthResult<{ reset: boolean }>> => {
    return authFetch("/auth/reset-password", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  },
  signOut: async (): Promise<AuthResult<{ revoked: boolean }>> => {
    const refreshToken = getRefreshToken();
    const result = refreshToken
      ? await authFetch<{ revoked: boolean }>("/auth/logout", {
          body: JSON.stringify({ refreshToken }),
          headers: { "content-type": "application/json" },
          method: "POST",
        })
      : { data: { revoked: false }, error: null };
    clearSession();
    return result;
  },
  signUp: async (input: {
    confirmPassword: string;
    email?: string;
    firstName: string;
    idCardNo?: string;
    lastName: string;
    locale?: string;
    mobile: string;
    password: string;
    referralCode?: string;
    referralClickId?: string;
    timezone?: string;
  }): Promise<AuthResult<{ user: PlatformUser; verificationRequired: boolean }>> => {
    return authFetch("/auth/register", {
      body: JSON.stringify({
        confirmPassword: input.confirmPassword,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        locale: input.locale,
        mobile: input.mobile,
        password: input.password,
        referralCode: input.referralCode,
        referralClickId: input.referralClickId,
        timezone: input.timezone,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  },
  completeProfile: async (input: {
    confirmPassword: string;
    email?: string;
    firstName: string;
    idCardNo?: string;
    lastName: string;
    locale?: string;
    mobile?: string;
    password: string;
    timezone?: string;
  }): Promise<AuthResult<PlatformUser>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before completing your profile") };
    const result = await authFetch<PlatformUser>("/auth/profile/complete", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "POST",
    });
    if (result.data) window.dispatchEvent(new Event(AUTH_EVENT));
    return result;
  },
  updateProfile: async (input: { firstName?: string; idCardNo?: string; lastName?: string; locale?: string; timezone?: string }): Promise<AuthResult<PlatformUser>> => {
    const token = getAccessToken();
    if (!token) return { error: new Error("You must sign in before updating your profile") };
    const result = await authFetch<PlatformUser>("/auth/me", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      method: "PATCH",
    });
    if (result.data) window.dispatchEvent(new Event(AUTH_EVENT));
    return result;
  },
};

export async function fetchWithAuthRefresh(
  input: string | URL,
  init: RequestInit = {},
  options: { accessToken?: string | null } = {},
) {
  const firstToken = options.accessToken ?? getAccessToken();
  const firstResponse = await fetch(input, withAuthorization(init, firstToken));
  if (firstResponse.status !== 401 || options.accessToken) return firstResponse;

  const refreshed = await platformAuth.refreshSession();
  if (refreshed.error || !refreshed.data?.accessToken) return firstResponse;

  return fetch(input, withAuthorization(init, refreshed.data.accessToken));
}

export const oauthClient = {
  getProviders: () => authFetch<{ providers: OAuthProvider[] }>("/auth/oauth/providers"),
  signInWithOAuth: async (provider: OAuthProvider, options?: { redirectTo?: string }) => {
    const redirectTo = options?.redirectTo ?? "/";
    const result = await authFetch<{ url: string }>(`/auth/oauth/${provider}/start?redirectTo=${encodeURIComponent(redirectTo)}`);
    if (result.error || !result.data?.url) return { error: result.error ?? new Error(`${provider} OAuth start failed`), redirected: false };
    window.location.assign(result.data.url);
    return { error: null, redirected: true };
  },
};

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<AuthResult<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, init);
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) return { error: new Error(readApiError(payload) ?? `Auth request failed: ${response.status}`) };
    return { data: payload as T, error: null };
  } catch (error) {
    return { error: normalizeNetworkError(error) };
  }
}

function normalizeNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("networkerror") ||
    message.toLowerCase().includes("load failed")
  ) {
    return new Error("ارتباط امن با نقره برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید و چند لحظه بعد دوباره تلاش کنید.");
  }
  return error instanceof Error ? error : new Error("درخواست احراز هویت با خطا روبه‌رو شد.");
}

function resolveBrowserApiBase(configuredBase: string) {
  if (typeof window === "undefined") return configuredBase;
  try {
    const configuredUrl = new URL(configuredBase, window.location.origin);
    const pageIsPublic = !["localhost", "127.0.0.1"].includes(window.location.hostname);
    const apiIsLocal = ["localhost", "127.0.0.1"].includes(configuredUrl.hostname);
    if (pageIsPublic && apiIsLocal) return `${window.location.origin}/api/v1`;
    return configuredUrl.toString().replace(/\/$/, "");
  } catch {
    return `${window.location.origin}/api/v1`;
  }
}

async function refreshSession(): Promise<AuthResult<AuthSession>> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return { error: new Error("Refresh token is missing") };
  const result = await authFetch<AuthSession>("/auth/refresh", {
    body: JSON.stringify({ refreshToken }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (result.data) persistSession(result.data);
  return result;
}

function withAuthorization(init: RequestInit, token?: string | null): RequestInit {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else headers.delete("Authorization");
  return { ...init, headers };
}

function persistSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  window.localStorage.setItem("accessToken", session.accessToken);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem("accessToken");
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function readStoredSession(): AuthSession | null {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, sessionId: "" };
}

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? window.localStorage.getItem("accessToken");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function readApiError(payload: unknown) {
  return extractApiError(payload);
}
import { extractApiError } from "@/shared/lib/api-error";
