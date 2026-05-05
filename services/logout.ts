import { clearSession, getRefreshToken } from "./authSession";
import { logout } from "./users";

export async function performLogout() {
  try {
    await logout(getRefreshToken() ?? undefined);
  } catch {
    // Session must still be cleared locally even when backend is unavailable.
  } finally {
    clearSession();
  }
}
