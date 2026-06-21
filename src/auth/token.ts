// JWT + session id persistence. Survives reloads so a guest can come back
// and restore their feed.

import type { JourneyName, SessionMode } from '@/api/types'

const TOKEN_KEY = 'guest.jwt'
const SESSION_KEY = 'guest.session_id'
const JOURNEY_KEY = 'guest.journey'
const MODE_KEY = 'guest.mode'

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
  localStorage.removeItem(JOURNEY_KEY)
  localStorage.removeItem(MODE_KEY)
}

export function hasAuth(): boolean {
  return Boolean(getToken() && getSessionId())
}

// Journey / mode chosen by the QR code at entry. Persisted so the feed loads
// the right journey on reload, and a returning guest restores into the same
// one. The session row is the server-side source of truth; this is the local
// hint the SPA needs before it has re-fetched the session.

export function setJourneyContext(journey: JourneyName, mode: SessionMode): void {
  localStorage.setItem(JOURNEY_KEY, journey)
  localStorage.setItem(MODE_KEY, mode)
}

export function getJourney(): JourneyName {
  return localStorage.getItem(JOURNEY_KEY) === 'delivery' ? 'delivery' : 'restaurant'
}

export function getMode(): SessionMode {
  return localStorage.getItem(MODE_KEY) === 'targeted' ? 'targeted' : 'non_targeted'
}
