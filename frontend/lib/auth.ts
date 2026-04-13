// ── Frontend-only Auth Utility (localStorage) ────────────

const AUTH_KEY = 'auth';
const AUTH_EVENT = 'auth-change';

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function subscribeToAuth(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener(AUTH_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(AUTH_EVENT, handleChange);
  };
}

export function getAuthSnapshot() {
  return isAuthenticated();
}

export function getAuthServerSnapshot() {
  return false;
}

/** Store auth flag in localStorage and as a cookie */
export function setAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, 'true');
  document.cookie = `auth=true; path=/; max-age=31536000`; // 1 year expiry
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Remove auth flag from localStorage and clear cookie */
export function removeAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
  document.cookie = `auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`; // clear cookie
  window.dispatchEvent(new Event(AUTH_EVENT));
}
