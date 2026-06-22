// JWT + session id persistence. Survives reloads so a guest can come back
// and restore their feed.

import type { JourneyName, SessionMode } from '@/api/types'

const TOKEN_KEY = 'guest.jwt'
const SESSION_KEY = 'guest.session_id'
const JOURNEY_KEY = 'guest.journey'

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
}

export function hasAuth(): boolean {
  return Boolean(getToken() && getSessionId())
}

// Journey is chosen per QR (`?journey=`) and persisted so the feed loads the
// right journey on reload / for a returning guest. Mode is NOT stored: it is a
// build-time constant (`VITE_APP_MODE`) — each deployment/domain is exactly one
// mode (targeted or non_targeted), so it can never drift per session.

export function setJourney(journey: JourneyName): void {
  localStorage.setItem(JOURNEY_KEY, journey)
}

export function getJourney(): JourneyName {
  return localStorage.getItem(JOURNEY_KEY) === 'delivery' ? 'delivery' : 'restaurant'
}

export function getMode(): SessionMode {
  return import.meta.env.VITE_APP_MODE === 'targeted' ? 'targeted' : 'non_targeted'
}
