const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "usuario";

type UserSession = {
  id: number;
  nome: string;
  acesso: "administrador" | "usuario";
  email?: string;
};

type SessionPayload = {
  token: string;
  refreshToken?: string;
  usuario: UserSession;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): UserSession | null {
  if (!canUseStorage()) return null;

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as UserSession;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(payload: SessionPayload) {
  if (!canUseStorage()) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.usuario));

  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  }
}

export function updateTokens(token: string, refreshToken?: string) {
  if (!canUseStorage()) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function updateStoredUser(
  updates: Partial<UserSession> | ((current: UserSession) => UserSession)
) {
  if (!canUseStorage()) return null;

  const current = getStoredUser();
  if (!current) return null;

  const nextUser =
    typeof updates === "function"
      ? updates(current)
      : { ...current, ...updates };

  localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  return nextUser;
}

export function clearSession() {
  if (!canUseStorage()) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function hasSession() {
  return Boolean(getAccessToken() && getStoredUser());
}
