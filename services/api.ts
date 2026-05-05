const LOCAL_API_URL = "http://localhost:8000";
const PROD_API_URL = "https://backend-dashkommo.onrender.com";

function removeTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function resolveApiUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const normalized = removeTrailingSlash(envUrl);
    if (process.env.NODE_ENV === "production" && !normalized.startsWith("https://")) {
      throw new Error("NEXT_PUBLIC_API_URL deve usar HTTPS em produção.");
    }
    return normalized;
  }

  if (process.env.NODE_ENV === "production") {
    return PROD_API_URL;
  }

  return LOCAL_API_URL;
}

const API_URL = resolveApiUrl();

export const api = {
  baseURL: API_URL,
};

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}) {
  const { authFetch } = await import("./authFetch");
  return authFetch(endpoint, options);
}
