import { api } from "./api";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from "./authSession";

type AuthFetchOptions = RequestInit & {
  auth?: boolean;
};

const REQUEST_TIMEOUT_MS = 15000;
let refreshPromise: Promise<boolean> | null = null;

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json")
    ? await response.json()
    : await response.text();
}

function getErrorMessage(data: unknown) {
  if (typeof data === "object" && data && "message" in data) {
    const maybeMessage = (data as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return "Erro na requisição";
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${api.baseURL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as {
        token?: string;
        refreshToken?: string;
      };

      if (!data.token) {
        return false;
      }

      updateTokens(data.token, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function executeFetch(
  endpoint: string,
  options: AuthFetchOptions = {},
  allowRefresh = true
) {
  const { auth = true, headers, body, signal, ...rest } = options;
  const token = getAccessToken();
  const isFormData = body instanceof FormData;
  const timeout = withTimeout(signal);

  try {
    const response = await fetch(`${api.baseURL}${endpoint}`, {
      ...rest,
      signal: timeout.signal,
      credentials: rest.credentials ?? "include",
      body,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

    if ((response.status === 401 || response.status === 403) && auth) {
      const canRefresh = allowRefresh && endpoint !== "/auth/refresh";
      if (canRefresh && (await refreshAccessToken())) {
        return executeFetch(endpoint, options, false);
      }

      clearSession();
      redirectToLogin();
      throw new Error("Não autorizado");
    }

    const data = await parseResponse(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(data));
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tempo limite excedido ao comunicar com o backend");
    }
    throw error;
  } finally {
    timeout.cleanup();
  }
}

export async function authFetch(
  endpoint: string,
  options: AuthFetchOptions = {}
) {
  return executeFetch(endpoint, options);
}
