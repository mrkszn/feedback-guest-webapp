// JWT + session id persistence. Survives reloads so a guest can come back
// and restore their feed.

const TOKEN_KEY = 'guest.jwt'
const SESSION_KEY = 'guest.session_id'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function setAuth(token: string, sessionId: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(SESSION_KEY, sessionId)
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function hasAuth(): boolean {
  return Boolean(getToken() && getSessionId())
}
